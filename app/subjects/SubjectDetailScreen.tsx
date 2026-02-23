
import {
  PublicationFilters,
  SortBy,
  SortOrder,
} from "@/app/components/filters/PublicationFilters";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { escucharPublicacionesPorMateria } from "@/scripts/services/Publications";
import {
  ArchivoPublicacion,
  Publicacion,
} from "@/scripts/types/Publication.type";
import * as downloadsService from "@/services/downloads.service";
import { CACHE_KEYS, getCache, setCache } from "@/services/cache.service";
import { openRemoteFileExternally } from "@/services/openExternalFile.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { Animated, Image, Linking, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Card, FAB, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PublicationCardSkeleton from "../profile/PublicationCardSkeleton";
import PublicationFilesList from "./components/PublicationFilesList";
import { getStyles } from "./_SubjectDetailScreen.styles";

type SubjectViewMode = "publicaciones" | "secciones";

type SubjectTeacher = {
  id: string;
  nombre: string;
};

type SubjectSection = {
  id: string;
  nombre: string;
};

type SubjectFileItem = {
  id: string;
  publicacionId: string;
  tipoArchivoId?: string;
  titulo: string;
  seccionId: string;
  seccionNombre?: string;
  descripcion?: string | null;
  webUrl?: string;
  filepath?: string | null;
  tipoNombre?: string;
  extension?: string;
  esEnlaceExterno?: boolean;
  tamanoBytes?: number;
  fechaSubida?: Date;
  activo?: boolean;
};

const getFileExtension = (fileName?: string): string => {
  if (!fileName) return "";
  const cleanName = fileName.split("?")[0];
  const dotIndex = cleanName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === cleanName.length - 1) return "";
  return cleanName.slice(dotIndex + 1).toUpperCase();
};

const inferTipoNombre = (rawTipo: string | undefined, extension: string): string => {
  const normalizedTipo = String(rawTipo || "").trim();
  if (normalizedTipo) return normalizedTipo;

  const ext = extension.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"].includes(ext)) return "Imagen";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "Video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "Audio";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["xls", "xlsx"].includes(ext)) return "Excel";
  if (["ppt", "pptx"].includes(ext)) return "PowerPoint";
  if (["zip", "rar", "7z"].includes(ext)) return "Comprimido";
  if (["txt", "md"].includes(ext)) return "Texto";
  return "Archivo";
};

const getFileIconByType = (typeName: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const type = (typeName || "").toLowerCase();
  if (type.includes("pdf")) return "file-pdf-box";
  if (type.includes("imagen")) return "image";
  if (type.includes("video")) return "video";
  if (type.includes("zip") || type.includes("rar")) return "folder-zip";
  if (type.includes("word")) return "file-word";
  if (type.includes("excel")) return "file-excel";
  if (type.includes("presentación") || type.includes("powerpoint")) return "file-powerpoint";
  if (type.includes("audio") || type.includes("mp3")) return "music";
  if (type.includes("texto")) return "file-document-outline";
  if (type.includes("enlace")) return "link-variant";
  return "file-document-outline";
};

export default function SubjectDetailScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const transitionAnim = React.useRef(new Animated.Value(1)).current;

  type RootStackParamList = {
    CreatePublication: { materiaId: string; materiaNombre: string };
    PublicationDetail: { publicacionId: string; materiaNombre: string };
    FileGallery: {
      archivos: ArchivoPublicacion[];
      indiceInicial: number;
      materiaNombre: string;
    };
  };

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();

  const params = route.params as {
    nombre?: string;
    id?: string;
    semestre?: number;
  };

  const subjectName = params?.nombre || "Materia";
  const materiaId = params?.id || "";

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [archivosCount, setArchivosCount] = useState<Record<string, number>>(
    {},
  );
  const [archivosExtensions, setArchivosExtensions] = useState<
    Record<string, string[]>
  >({});
  const [viewMode, setViewMode] = useState<SubjectViewMode>("publicaciones");
  const [sortBy, setSortBy] = useState<SortBy>("fecha");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacher[]>([]);
  const [subjectSections, setSubjectSections] = useState<SubjectSection[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");
  const [filesBySection, setFilesBySection] = useState<Record<string, SubjectFileItem[]>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const renderSectionFilePreview = (
    archivo: ArchivoPublicacion,
    isDownloading: boolean,
  ) => {
    const tipo = (archivo.tipoNombre || "").toLowerCase();
    const extension = (archivo.extension || getFileExtension(archivo.titulo)).toLowerCase();

    if (archivo.esEnlaceExterno) {
      return (
        <View style={styles.iconFallbackContainer}>
          <MaterialCommunityIcons
            name="link-variant"
            size={22}
            color={theme.colors.primary}
          />
        </View>
      );
    }

    const isImage =
      tipo.includes("imagen") ||
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic"].includes(extension);

    if (isImage && archivo.webUrl) {
      return (
        <Image
          source={{ uri: archivo.webUrl }}
          style={styles.archivoThumbImage}
          resizeMode="cover"
        />
      );
    }

    const iconName = getFileIconByType(archivo.tipoNombre || extension || "");
    return (
      <View style={styles.iconFallbackContainer}>
        <MaterialCommunityIcons
          name={iconName}
          size={22}
          color={theme.colors.primary}
        />
      </View>
    );
  };

  React.useEffect(() => {
    const loadSubjectViewMeta = async () => {
      if (!materiaId) return;
      try {
        const subjectSnap = await getDoc(doc(db, "materias", materiaId));
        const subjectData = subjectSnap.data() as any;
        const teacherIds: string[] = Array.isArray(subjectData?.docentesIds)
          ? subjectData.docentesIds.filter((id: unknown) => typeof id === "string")
          : [];
        const sectionIds: string[] = Array.isArray(subjectData?.seccionesIds)
          ? subjectData.seccionesIds.filter((id: unknown) => typeof id === "string")
          : [];

        const [teacherDocs, sectionDocs] = await Promise.all([
          Promise.all(teacherIds.map((id) => getDoc(doc(db, "docentes", id)))),
          Promise.all(sectionIds.map((id) => getDoc(doc(db, "secciones", id)))),
        ]);

        const loadedTeachers: SubjectTeacher[] = teacherDocs
          .filter((d) => d.exists())
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              nombre: `${data.nombres || ""} ${data.apellidos || ""}`.trim(),
            };
          });

        const loadedSections: SubjectSection[] = sectionDocs
          .filter((d) => d.exists())
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              nombre: data.nombre || "Seccion",
            };
          });

        setSubjectTeachers(loadedTeachers);
        setSubjectSections(loadedSections);
        setExpandedSections((prev) => {
          const next: Record<string, boolean> = {};
          loadedSections.forEach((section, index) => {
            next[section.id] = prev[section.id] ?? index === 0;
          });
          return next;
        });
      } catch (error) {
        console.warn("Error cargando docentes/secciones de materia:", error);
      }
    };

    loadSubjectViewMeta();
  }, [materiaId]);

  const handleFilterChange = useCallback(
    (newSortBy: SortBy, newSortOrder: SortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    [],
  );

  const switchViewMode = (nextMode: SubjectViewMode) => {
    if (nextMode === viewMode) return;
    Animated.sequence([
      Animated.timing(transitionAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    setViewMode(nextMode);
  };

  const toggleViewMode = () => {
    switchViewMode(viewMode === "publicaciones" ? "secciones" : "publicaciones");
  };

  useFocusEffect(
    useCallback(() => {
      if (!materiaId) return;
      setCargando(true);

      
      getCache<any[]>(CACHE_KEYS.subjectPublications(materiaId))
        .then((cached) => {
          if (cached && cached.length > 0) {
            const restored = cached.map((p: any) => ({
              ...p,
              fechaPublicacion: new Date(p.fechaPublicacion),
            }));
            setPublicaciones(restored);
            setCargando(false);
          }
        })
        .catch(() => {});

      const unsubscribe = escucharPublicacionesPorMateria(
        materiaId,
        async (items) => {
          setPublicaciones(items);
          setCargando(false);
          
          const serializable = items.map((p) => ({
            ...p,
            fechaPublicacion: p.fechaPublicacion.toISOString(),
          }));
          setCache(CACHE_KEYS.subjectPublications(materiaId), serializable);

          
          try {
            const pubIds = items.map((p) => p.id);
            if (pubIds.length === 0) {
              setArchivosCount({});
              setArchivosExtensions({});
              setFilesBySection({});
              return;
            }

            const chunkSize = 30;
            const chunks: string[][] = [];
            for (let i = 0; i < pubIds.length; i += chunkSize) {
              chunks.push(pubIds.slice(i, i + chunkSize));
            }

            const snapChunks = await Promise.all(
              chunks.map((chunk) =>
                getDocs(
                  query(
                    collection(db, "archivos"),
                    where("activo", "==", true),
                    where("publicacionId", "in", chunk),
                  ),
                ),
              ),
            );

            const countMap: Record<string, number> = {};
            const extMap: Record<string, Set<string>> = {};
            const sectionMap: Record<string, SubjectFileItem[]> = {};

            snapChunks.forEach((snap) => {
              snap.docs.forEach((d) => {
                const data = d.data() as any;
                const pubId = String(data.publicacionId || "");
                if (!pubId) return;

                countMap[pubId] = (countMap[pubId] || 0) + 1;
                if (!extMap[pubId]) extMap[pubId] = new Set();

                const ext = String(data.extension || data.tipoNombre || "")
                  .toUpperCase()
                  .replace(".", "");
                if (ext) extMap[pubId].add(ext);

                const seccionId = String(data.seccionId || "");
                if (!seccionId) return;
                if (!sectionMap[seccionId]) sectionMap[seccionId] = [];
                sectionMap[seccionId].push({
                  id: d.id,
                  publicacionId: pubId,
                  tipoArchivoId: data.tipoArchivoId || "",
                  titulo: String(data.titulo || "Archivo"),
                  seccionId,
                  seccionNombre: data.seccionNombre || undefined,
                  descripcion: data.descripcion ?? null,
                  webUrl: data.webUrl || undefined,
                  filepath: data.filepath ?? null,
                  tipoNombre: data.tipoNombre || undefined,
                  extension: data.extension || undefined,
                  esEnlaceExterno: !!data.esEnlaceExterno,
                  tamanoBytes:
                    typeof data.tamanoBytes === "number" ? data.tamanoBytes : 0,
                  fechaSubida:
                    data.fechaSubida && typeof data.fechaSubida.toDate === "function"
                      ? data.fechaSubida.toDate()
                      : new Date(),
                  activo: true,
                });
              });
            });

            setArchivosCount(countMap);
            const extResult: Record<string, string[]> = {};
            Object.keys(extMap).forEach((k) => {
              extResult[k] = Array.from(extMap[k]);
            });
            setArchivosExtensions(extResult);
            setFilesBySection(sectionMap);
          } catch (e) {
            console.warn("Error contando archivos:", e);
          }
        },
      );
      return () => unsubscribe();
    }, [materiaId]),
  );

  
  const aplicarFiltros = (publicaciones: Publicacion[]): Publicacion[] => {
    let filtered = [...publicaciones];

    switch (sortBy) {
      case "fecha":
        filtered = filtered.sort((a, b) =>
          sortOrder === "desc"
            ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
            : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime(),
        );
        break;

      case "vistas":
        filtered = filtered.sort((a, b) =>
          sortOrder === "desc"
            ? (b.vistas || 0) - (a.vistas || 0)
            : (a.vistas || 0) - (b.vistas || 0),
        );
        break;

      case "likes":
        filtered = filtered.sort((a, b) =>
          sortOrder === "desc"
            ? (b.totalCalificaciones || 0) - (a.totalCalificaciones || 0)
            : (a.totalCalificaciones || 0) - (b.totalCalificaciones || 0),
        );
        break;

      case "comentarios":
        filtered = filtered.sort((a, b) =>
          sortOrder === "desc"
            ? (b.totalComentarios || 0) - (a.totalComentarios || 0)
            : (a.totalComentarios || 0) - (b.totalComentarios || 0),
        );
        break;
      case "semestre":
        filtered = filtered.sort((a, b) =>
          sortOrder === "desc"
            ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
            : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime(),
        );
        break;
      default:
        break;
    }

    return filtered;
  };

  const publicacionesFiltradas = aplicarFiltros(publicaciones);
  const publicacionesPorDocente = React.useMemo(() => {
    if (selectedTeacherId === "all") return publicacionesFiltradas;
    return publicacionesFiltradas.filter(
      (p) => (p.docenteUid || p.autorUid) === selectedTeacherId,
    );
  }, [publicacionesFiltradas, selectedTeacherId]);

  const filesBySectionForTeacher = React.useMemo(() => {
    const allowedPubIds = new Set(publicacionesPorDocente.map((p) => p.id));
    const result: Record<string, SubjectFileItem[]> = {};
    Object.entries(filesBySection).forEach(([sectionId, files]) => {
      result[sectionId] = files.filter((file) => allowedPubIds.has(file.publicacionId));
    });
    return result;
  }, [filesBySection, publicacionesPorDocente]);

  const formatearFecha = (fecha: Date): string => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (dias === 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;

    return fecha.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "short",
    });
  };

  const abrirNuevaPublicacion = () => {
    navigation.navigate("CreatePublication", {
      materiaId,
      materiaNombre: subjectName,
    });
  };

  const abrirDetallePublicacion = (publicacion: Publicacion) => {
    navigation.navigate("PublicationDetail", {
      publicacionId: publicacion.id,
      materiaNombre: subjectName,
    });
  };

  const toArchivoPublicacion = (file: SubjectFileItem): ArchivoPublicacion => {
    const fallbackExtension = getFileExtension(file.titulo);
    const extension = file.extension || fallbackExtension || null;
    const tipoNombre = inferTipoNombre(file.tipoNombre, String(extension || ""));
    return {
      id: file.id,
      publicacionId: file.publicacionId,
      tipoArchivoId: file.tipoArchivoId || "",
      titulo: file.titulo,
      descripcion: file.descripcion ?? null,
      seccionId: file.seccionId,
      seccionNombre: file.seccionNombre || null,
      webUrl: file.webUrl || "",
      filepath: file.filepath ?? null,
      tamanoBytes: file.tamanoBytes || 0,
      fechaSubida: file.fechaSubida || new Date(),
      activo: true,
      tipoNombre,
      extension,
      esEnlaceExterno: !!file.esEnlaceExterno,
    };
  };

  const isVisualizableFile = (file: SubjectFileItem): boolean => {
    if (file.esEnlaceExterno) return false;
    const tipo = (file.tipoNombre || "").toLowerCase();
    const ext = (file.extension || getFileExtension(file.titulo)).toLowerCase();
    return (
      tipo.includes("imagen") ||
      tipo.includes("video") ||
      tipo.includes("audio") ||
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "mp4", "mov", "webm", "mp3", "wav", "ogg"].includes(ext)
    );
  };

  const abrirArchivo = async (file: SubjectFileItem) => {
    if (file.esEnlaceExterno && file.webUrl) {
      const canOpen = await Linking.canOpenURL(file.webUrl);
      if (canOpen) await Linking.openURL(file.webUrl);
      return;
    }

    if (isVisualizableFile(file)) {
      const sectionFiles = filesBySectionForTeacher[file.seccionId] || [];
      const archivosSerializados = sectionFiles.map((f) => {
        const mapped = toArchivoPublicacion(f);
        return {
          ...mapped,
          fechaSubida:
            mapped.fechaSubida instanceof Date
              ? mapped.fechaSubida.toISOString()
              : mapped.fechaSubida,
        };
      });
      const indiceInicial = Math.max(
        0,
        sectionFiles.findIndex((f) => f.id === file.id),
      );
      (navigation.navigate as any)("FileGallery", {
        archivos: archivosSerializados,
        indiceInicial,
        materiaNombre: subjectName,
      });
      return;
    }

    try {
      const mapped = toArchivoPublicacion(file);
      await openRemoteFileExternally({
        url: mapped.webUrl,
        titulo: mapped.titulo,
        tipoNombre: mapped.tipoNombre,
      });
    } catch (error) {
      console.warn("No se pudo abrir el archivo directo:", error);
    }
  };

  const descargarArchivoSeccion = async (file: SubjectFileItem) => {
    if (file.esEnlaceExterno && file.webUrl) {
      const canOpen = await Linking.canOpenURL(file.webUrl);
      if (canOpen) await Linking.openURL(file.webUrl);
      return;
    }

    const archivoCompleto = toArchivoPublicacion(file);

    setDownloadingFileId(file.id);
    setDownloadProgress(0);
    try {
      await downloadsService.descargarArchivo(
        archivoCompleto,
        (progress) => {
          setDownloadProgress(Math.round((progress.progress || 0) * 100));
        },
        false,
      );
    } finally {
      setDownloadingFileId(null);
      setDownloadProgress(0);
    }
  };

  const renderPublicationCard = (publicacion: Publicacion) => (
    <Pressable
      key={publicacion.id}
      onPress={() => abrirDetallePublicacion(publicacion)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.elevation.level1 },
        ]}
        elevation={1}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.topRow}>
            <View style={{ position: "relative" }}>
              {publicacion.autorFoto ? (
                <Avatar.Image
                  size={40}
                  source={{ uri: publicacion.autorFoto }}
                />
              ) : (
                <Avatar.Text
                  size={40}
                  label={
                    publicacion.autorNombre?.charAt(0).toUpperCase() ||
                    "?"
                  }
                />
              )}
              <AdminBadge
                size={40}
                role={publicacion.autorRol}
                backgroundColor={theme.colors.elevation.level1}
              />
            </View>

            <View style={styles.infoBlock}>
              <Text
                variant="titleSmall"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "700",
                }}
              >
                {publicacion.titulo}
              </Text>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {publicacion.autorNombre}
              </Text>
            </View>
          </View>

          {publicacion.descripcion ? (
            <Text
              variant="bodySmall"
              numberOfLines={2}
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}
            >
              {publicacion.descripcion}
            </Text>
          ) : null}

          <View
            style={{
              height: 1,
              backgroundColor: theme.colors.outlineVariant,
              opacity: 0.5,
            }}
          />

          <View style={styles.statsRowWithDate}>
            <View style={styles.statsRow}>
              {(archivosCount[publicacion.id] || 0) > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {archivosCount[publicacion.id]}
                  </Text>
                </View>
              )}
              {publicacion.vistas > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="eye-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {publicacion.vistas}
                  </Text>
                </View>
              )}
              {publicacion.totalCalificaciones > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {publicacion.totalCalificaciones}
                  </Text>
                </View>
              )}
              {publicacion.totalComentarios > 0 && (
                <View style={styles.statItem}>
                  <MaterialCommunityIcons
                    name="comment-outline"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {publicacion.totalComentarios}
                  </Text>
                </View>
              )}
            </View>
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                opacity: 0.7,
                flexShrink: 0,
                minWidth: 46,
                textAlign: "right",
              }}
            >
              {formatearFecha(publicacion.fechaPublicacion)}
            </Text>
          </View>

          {(archivosExtensions[publicacion.id] || []).length > 0 && (
            <View style={styles.fileTypesRow}>
              {(archivosExtensions[publicacion.id] || []).map((ext) => (
                <View
                  key={ext}
                  style={[
                    styles.fileTypeTag,
                    {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="file-outline"
                    size={12}
                    color={theme.colors.onSecondaryContainer}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: theme.colors.onSecondaryContainer,
                    }}
                  >
                    {ext}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </Pressable>
  );

  const renderSectionScrollable = () =>
    subjectSections.map((section) => {
      const files = filesBySectionForTeacher[section.id] || [];
      const isExpanded = !!expandedSections[section.id];

      return (
        <View key={section.id} style={styles.sectionBlock}>
          <TouchableOpacity
            style={styles.sectionAccordionHeader}
            onPress={() =>
              setExpandedSections((prev) => ({
                ...prev,
                [section.id]: !prev[section.id],
              }))
            }
          >
            <View style={styles.sectionHeaderContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {section.nombre}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {files.length} archivos
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {isExpanded && files.length > 0 ? (
            <View style={styles.sectionFilesList}>
              <PublicationFilesList
                files={files.map(toArchivoPublicacion)}
                styles={styles}
                theme={theme}
                downloadProgress={downloadProgress}
                isDownloading={(archivo) => downloadingFileId === archivo.id}
                onPressFile={(archivo) => {
                  const source = files.find((f) => f.id === archivo.id);
                  if (source) void abrirArchivo(source);
                }}
                onDownloadOrOpen={(archivo) => {
                  const source = files.find((f) => f.id === archivo.id);
                  if (source) void descargarArchivoSeccion(source);
                }}
                renderPreview={renderSectionFilePreview}
                getOpeningLabel={() => "Abriendo..."}
              />
            </View>
          ) : isExpanded ? (
            <View style={styles.sectionEmpty}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Sin archivos en esta sección
              </Text>
            </View>
          ) : null}
        </View>
      );
    });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subjectName} />
        <Appbar.Action
          icon="swap-horizontal"
          onPress={toggleViewMode}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View style={styles.viewModeChipsRow}>
          <TouchableOpacity
            onPress={() => switchViewMode("publicaciones")}
            style={[
              styles.viewModeChip,
              viewMode === "publicaciones"
                ? styles.viewModeChipActive
                : styles.viewModeChipInactive,
            ]}
          >
            <Text
              style={{
                color:
                  viewMode === "publicaciones"
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                fontWeight: viewMode === "publicaciones" ? "600" : "500",
              }}
            >
              Publicaciones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchViewMode("secciones")}
            style={[
              styles.viewModeChip,
              viewMode === "secciones"
                ? styles.viewModeChipActive
                : styles.viewModeChipInactive,
            ]}
          >
            <Text
              style={{
                color:
                  viewMode === "secciones"
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                fontWeight: viewMode === "secciones" ? "600" : "500",
              }}
            >
              Secciones
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === "publicaciones" ? (
          <PublicationFilters
            sortBy={sortBy}
            sortOrder={sortOrder}
            onFilterChange={handleFilterChange}
            theme={theme}
            showSemestreFilter={false}
          />
        ) : (
          <View style={styles.altViewControls}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.teacherChipsRow}>
                <TouchableOpacity
                  onPress={() => setSelectedTeacherId("all")}
                  style={[
                    styles.teacherChip,
                    selectedTeacherId === "all"
                      ? { backgroundColor: theme.colors.primaryContainer }
                      : { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        selectedTeacherId === "all"
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    }}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                {subjectTeachers.map((teacher) => (
                  <TouchableOpacity
                    key={teacher.id}
                    onPress={() => setSelectedTeacherId(teacher.id)}
                    style={[
                      styles.teacherChip,
                      selectedTeacherId === teacher.id
                        ? { backgroundColor: theme.colors.primaryContainer }
                        : { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    >
                      <Text
                        numberOfLines={1}
                      style={{
                        color:
                          selectedTeacherId === teacher.id
                            ? theme.colors.onPrimaryContainer
                            : theme.colors.onSurfaceVariant,
                      }}
                      >
                        {teacher.nombre}
                      </Text>
                    </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Animated.View
          style={{
            opacity: transitionAnim,
            transform: [
              {
                translateY: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          {cargando ? (
          <>
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
          </>
          ) : viewMode === "publicaciones" ? (
            publicacionesFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="headlineSmall" style={styles.emptyText}>
                  No hay publicaciones aún
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Sé el primero en compartir contenido
                </Text>
              </View>
            ) : (
              publicacionesFiltradas.map(renderPublicationCard)
            )
          ) : subjectSections.length > 0 ? (
            renderSectionScrollable()
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={styles.emptyText}>
                No hay secciones configuradas
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom }]}
        onPress={abrirNuevaPublicacion}
      />
    </View>
  );
}
