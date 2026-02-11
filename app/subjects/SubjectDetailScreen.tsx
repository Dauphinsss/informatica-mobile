
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
import { CACHE_KEYS, getCache, setCache } from "@/services/cache.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Appbar, Avatar, Card, FAB, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PublicationCardSkeleton from "../profile/PublicationCardSkeleton";
import { getStyles } from "./_SubjectDetailScreen.styles";

export default function SubjectDetailScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

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
  const materiaSemestre = params?.semestre || 0;

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [archivosCount, setArchivosCount] = useState<Record<string, number>>(
    {},
  );
  const [archivosExtensions, setArchivosExtensions] = useState<
    Record<string, string[]>
  >({});
  const [sortBy, setSortBy] = useState<SortBy>("fecha");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleFilterChange = useCallback(
    (newSortBy: SortBy, newSortOrder: SortOrder) => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
    },
    [],
  );

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
            if (pubIds.length > 0) {
              const archivosSnap = await getDocs(
                query(
                  collection(db, "archivos"),
                  where("activo", "==", true),
                  where("publicacionId", "in", pubIds.slice(0, 30)),
                ),
              );
              const countMap: Record<string, number> = {};
              const extMap: Record<string, Set<string>> = {};
              archivosSnap.docs.forEach((d) => {
                const data = d.data();
                const pubId = data.publicacionId;
                if (pubId) {
                  countMap[pubId] = (countMap[pubId] || 0) + 1;
                  if (!extMap[pubId]) extMap[pubId] = new Set();
                  const ext = (data.extension || data.tipoNombre || "")
                    .toUpperCase()
                    .replace(".", "");
                  if (ext) extMap[pubId].add(ext);
                }
              });
              setArchivosCount(countMap);
              const extResult: Record<string, string[]> = {};
              Object.keys(extMap).forEach((k) => {
                extResult[k] = Array.from(extMap[k]);
              });
              setArchivosExtensions(extResult);
            }
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subjectName} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <PublicationFilters
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={handleFilterChange}
          theme={theme}
          showSemestreFilter={false}
        />
        {cargando ? (
          <>
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
            <PublicationCardSkeleton withHorizontalMargin={false} />
          </>
        ) : publicacionesFiltradas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>
              No hay publicaciones aún
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Sé el primero en compartir contenido
            </Text>
          </View>
        ) : (
          publicacionesFiltradas.map((publicacion) => (
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
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom }]}
        onPress={abrirNuevaPublicacion}
      />
    </View>
  );
}
