import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  eliminarArchivo,
  guardarEnlaceExterno,
  obtenerTiposArchivo,
  seleccionarArchivo,
  subirArchivo,
} from "@/scripts/services/Files";
import {
  incrementarVistas,
  obtenerArchivosConTipo,
  obtenerPublicacionPorId,
} from "@/scripts/services/Publications";
import { eliminarPublicacionYArchivos } from "@/scripts/services/Reports";
import {
  ArchivoPublicacion,
  Publicacion,
} from "@/scripts/types/Publication.type";
import { registrarActividadCliente } from "@/services/activity.service";
import {
  CACHE_KEYS,
  downloadAndCachePdf,
  getCache,
  getPdfFromCache,
  setCache,
} from "@/services/cache.service";
import { comentariosService } from "@/services/comments.service";
import * as downloadsService from "@/services/downloads.service";
import { likesService } from "@/services/likes.service";
import { openRemoteFileExternally } from "@/services/openExternalFile.service";
import { compartirPublicacionMejorado } from "@/services/shareService";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomAlert, {
  CustomAlertButton,
  CustomAlertType,
} from "../../components/ui/CustomAlert";
import ReportReasonModal from "../../components/ui/ReportReasonModal";
import CommentsModal from "../components/comments/CommentsModal";
import { PublicationDetailSkeleton } from "../components/publications/PublicationDetailSkeleton";
import { getStyles } from "./_PublicationDetailScreen.styles";

const { width } = Dimensions.get("window");

const normalizeAuthorRole = (role?: string | null): "admin" | "usuario" => {
  const normalized = String(role || "").trim().toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "administrador" ||
    normalized === "administrator"
  ) {
    return "admin";
  }
  return "usuario";
};

export default function PublicationDetailScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const auth = getAuth();
  const usuario = auth.currentUser;

  const params = route.params as {
    publicacionId?: string;
    materiaNombre?: string;
  };

  const publicacionId = params?.publicacionId || "";
  const materiaNombre = params?.materiaNombre || "Materia";

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [displayedMateriaNombre, setDisplayedMateriaNombre] =
    useState(materiaNombre);
  const [archivos, setArchivos] = useState<ArchivoPublicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [tiposArchivo, setTiposArchivo] = useState<any[]>([]);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [confirmDeleteFileVisible, setConfirmDeleteFileVisible] =
    useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);
  const [filesMarkedForDelete, setFilesMarkedForDelete] = useState<string[]>(
    [],
  );
  const [stagedAdds, setStagedAdds] = useState<
    {
      id: string;
      file?: any;
      tipoId: string;
      tipoArchivoId?: string;
      name?: string;
      nombreEnlace?: string;
      esEnlaceExterno?: boolean;
      url?: string;
      subiendo?: boolean;
      progreso?: number;
    }[]
  >([]);
  const [dialogSeleccionVisible, setDialogSeleccionVisible] = useState(false);
  const [dialogEnlaceVisible, setDialogEnlaceVisible] = useState(false);
  const [urlEnlace, setUrlEnlace] = useState("");
  const [nombreEnlace, setNombreEnlace] = useState("");
  const [confirmDeletePubVisible, setConfirmDeletePubVisible] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [realTimeCommentCount, setRealTimeCommentCount] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CustomAlertType>("info");
  const [alertButtons, setAlertButtons] = useState<
    CustomAlertButton[] | undefined
  >(undefined);
  const [motivoDialogVisible, setMotivoDialogVisible] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>("");
  const accionPendiente = React.useRef<
    null | ((motivo: string) => Promise<void>)
  >(null);
  const [savedMotivo, setSavedMotivo] = useState<string>("");
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null,
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [openingProgress, setOpeningProgress] = useState<number>(0);
  const [inlineFileStatus, setInlineFileStatus] = useState<
    Record<string, string | undefined>
  >({});
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [sharingPublication, setSharingPublication] = useState(false);
  const [userRole, setUserRole] = useState<string>("usuario");

  const isOwner =
    publicacion && usuario && publicacion.autorUid === usuario.uid;
  const isAdmin = userRole === "admin";
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  const pedirMotivoYContinuar = (accion: (motivo: string) => Promise<void>) => {
    accionPendiente.current = accion;
    setMotivoSeleccionado("");
    setMotivoPersonalizado("");
    setMotivoDialogVisible(true);
  };

  useEffect(() => {
    (async () => {
      try {
        const tipos = await obtenerTiposArchivo();
        setTiposArchivo(tipos);
      } catch (err) {
        console.error("Error cargando tipos de archivo:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    getDoc(doc(db, "usuarios", usuario.uid))
      .then((snap) => {
        if (snap.exists()) setUserRole(snap.data()?.rol || "usuario");
      })
      .catch(() => {});
  }, [usuario]);

  const showAlert = (
    title: string | undefined,
    message: string,
    type: CustomAlertType = "info",
    buttons?: CustomAlertButton[],
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertButtons(
      buttons || [
        {
          text: "OK",
          onPress: () => {},
          mode: "contained",
        },
      ],
    );
    setAlertVisible(true);
  };
  const actualizarEstadisticasUsuario = async (
    usuarioUid: string,
    cambios: Record<string, number>,
  ): Promise<void> => {
    if (!usuarioUid) return;
    const data: Record<string, any> = {};
    Object.entries(cambios).forEach(([k, v]) => {
      data[k] = increment(v);
    });

    
    data.uid = usuarioUid;
    data.usuarioUid = usuarioUid;

    await setDoc(doc(db, "estadisticasUsuario", usuarioUid), data, {
      merge: true,
    });
  };
  const reportarPublicacion = async (
    publicacionId: string,
    motivo: string,
  ): Promise<boolean> => {
    try {
      const usuarioLocal = auth.currentUser;

      if (!usuarioLocal) {
        showAlert("Error", "Debes iniciar sesión para reportar", "error");
        return false;
      }

      const reportesExistentes = await getDocs(
        query(
          collection(db, "reportes"),
          where("publicacionUid", "==", publicacionId),
          where("autorUid", "==", usuarioLocal.uid),
        ),
      );

      if (!reportesExistentes.empty) {
        showAlert(
          "Ya reportaste esta publicación",
          "No puedes reportar la misma publicación más de una vez",
          "info",
        );
        return false;
      }

      await addDoc(collection(db, "reportes"), {
        publicacionUid: publicacionId,
        autorUid: usuarioLocal.uid,
        tipo: motivo,
        fechaCreacion: Timestamp.now(),
        estado: "pendiente",
      });
      let autorPublicacionUid: string | undefined;
      let tituloPublicacion: string | undefined;
      let autorPublicacionNombre: string | undefined;
      try {
        const pubSnap = await getDoc(doc(db, "publicaciones", publicacionId));
        if (pubSnap.exists()) {
          const pubData = pubSnap.data() as any;
          autorPublicacionUid = pubData?.autorUid;
          tituloPublicacion = pubData?.titulo;
          autorPublicacionNombre = pubData?.autorNombre;
        }
      } catch (err) {
        console.warn(
          "No se pudo obtener autor de la publicación (solo para estadísticas):",
          err,
        );
      }

      (async () => {
        try {
          const actorNombre =
            usuarioLocal.displayName || usuarioLocal.email || undefined;
          const actividadTitulo = tituloPublicacion || "Publicación reportada";
          const actividadDescripcion = `Se reportó la publicación "${
            tituloPublicacion || publicacionId
          }"${
            autorPublicacionNombre
              ? ` del autor ${autorPublicacionNombre}`
              : autorPublicacionUid
                ? ` del autor ${autorPublicacionUid}`
                : ""
          } por motivo: ${motivo}`;

          await registrarActividadCliente(
            "publicacion_reportada",
            actividadTitulo,
            actividadDescripcion,
            usuarioLocal.uid,
            actorNombre,
            publicacionId,
            {
              motivo,
              autorPublicacionUid: autorPublicacionUid || undefined,
              autorPublicacionNombre: autorPublicacionNombre || undefined,
            },
          );
        } catch (err) {
          console.warn("No se pudo registrar actividad de reporte:", err);
        }
      })();

      actualizarEstadisticasUsuario(usuarioLocal.uid, {
        publicacionesReportadas: 1,
      }).catch((err) =>
        console.error("Error actualizando publicacionesReportadas:", err),
      );

      if (autorPublicacionUid && autorPublicacionUid !== usuarioLocal.uid) {
        actualizarEstadisticasUsuario(autorPublicacionUid, {
          reportesRecibidos: 1,
        }).catch((err) =>
          console.error("Error actualizando reportesRecibidos:", err),
        );
      }

      return true;
    } catch (error) {
      console.error("Error al reportar publicación:", error);
      throw error;
    }
  };

  const cargarPublicacion = useCallback(async () => {
    setCargando(true);
    try {
      const cachedPub = await getCache<any>(
        CACHE_KEYS.publicationDetail(publicacionId),
      );
      const cachedFiles = await getCache<any[]>(
        CACHE_KEYS.publicationFiles(publicacionId),
      );
      if (cachedPub) {
        setPublicacion({
          ...cachedPub,
          autorRol: normalizeAuthorRole(cachedPub.autorRol),
          fechaPublicacion: new Date(cachedPub.fechaPublicacion),
        });
        setCargando(false);
      }
      if (cachedFiles && cachedFiles.length > 0) {
        setArchivos(
          cachedFiles.map((a: any) => ({
            ...a,
            fechaSubida: a.fechaSubida ? new Date(a.fechaSubida) : undefined,
          })),
        );
      }

      const pub = await obtenerPublicacionPorId(publicacionId);
      if (pub) {
        setPublicacion(pub);
        setCache(CACHE_KEYS.publicationDetail(publicacionId), {
          ...pub,
          fechaPublicacion: pub.fechaPublicacion.toISOString(),
        });

        await incrementarVistas(publicacionId);
        const archivosData = await obtenerArchivosConTipo(publicacionId);
        setArchivos(archivosData);
        setCache(
          CACHE_KEYS.publicationFiles(publicacionId),
          archivosData.map((a) => ({
            ...a,
            fechaSubida:
              a.fechaSubida instanceof Date
                ? a.fechaSubida.toISOString()
                : a.fechaSubida,
          })),
        );

        if (usuario) {
          const likeQuery = query(
            collection(db, "likes"),
            where("publicacionId", "==", publicacionId),
            where("autorUid", "==", usuario.uid),
          );
          const likeSnapshot = await getDocs(likeQuery);
          setUserLiked(!likeSnapshot.empty);
        }
      }
    } catch (error) {
      console.error("Error cargando publicación:", error);
    } finally {
      setCargando(false);
    }
  }, [publicacionId, usuario]);

  useEffect(() => {
    if (!publicacionId) return;
    const unsubscribe = onSnapshot(
      doc(db, "publicaciones", publicacionId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPublicacion((prev) => {
            const incomingRole = normalizeAuthorRole(data.autorRol);
            const previousRole = normalizeAuthorRole(prev?.autorRol);
            const resolvedRole =
              incomingRole === "admin" || previousRole === "admin"
                ? "admin"
                : "usuario";

            return {
              id: doc.id,
              ...data,
              autorRol: resolvedRole,
              fechaPublicacion: data.fechaPublicacion.toDate(),
            } as Publicacion;
          });
        }
      },
    );
    return () => unsubscribe();
  }, [publicacionId]);

  useEffect(() => {
    if (!publicacionId) return;
    const q = query(
      collection(db, "archivos"),
      where("publicacionId", "==", publicacionId),
      where("activo", "==", true),
    );
    const unsub = onSnapshot(q, async () => {
      try {
        const nuevos = await obtenerArchivosConTipo(publicacionId);
        setArchivos(nuevos);
      } catch (err) {
        console.error("Error al refrescar archivos en realtime", err);
      }
    });
    return () => unsub();
  }, [publicacionId]);

  useEffect(() => {
    if (!publicacionId || !usuario) return;
    const likeQuery = query(
      collection(db, "likes"),
      where("publicacionId", "==", publicacionId),
      where("autorUid", "==", usuario.uid),
    );
    const unsubscribe = onSnapshot(likeQuery, (snapshot) => {
      setUserLiked(!snapshot.empty);
    });
    return () => unsubscribe();
  }, [publicacionId, usuario]);

  useEffect(() => {
    cargarPublicacion();
  }, [cargarPublicacion]);

  useEffect(() => {
    if (
      publicacion &&
      (materiaNombre === "Materia" ||
        materiaNombre === "Publicación compartida")
    ) {
      const obtenerNombreMateria = async () => {
        try {
          const materiaDoc = await getDoc(
            doc(db, "materias", publicacion.materiaId),
          );
          if (materiaDoc.exists()) {
            const nombreMateria = materiaDoc.data().nombre;
            setDisplayedMateriaNombre(nombreMateria);
          }
        } catch (error) {
          console.error("Error obteniendo nombre de materia:", error);
        }
      };
      obtenerNombreMateria();
    }
  }, [publicacion]);

  const toggleLike = async () => {
    if (!usuario) {
      showAlert("Error", "Debes iniciar sesión para dar like", "error");
      return;
    }

    try {
      setLikeLoading(true);
      await likesService.darLike(usuario.uid, publicacionId);
    } catch (error) {
      console.error("Error al dar like:", error);
      showAlert("Error", "No se pudo actualizar el like", "error");
    } finally {
      setLikeLoading(false);
    }
  };

  useEffect(() => {
    if (!publicacionId) return;

    const likesCountQuery = query(
      collection(db, "likes"),
      where("publicacionId", "==", publicacionId),
    );

    const unsubscribe = onSnapshot(likesCountQuery, (snapshot) => {
      setLikeCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [publicacionId]);

  useEffect(() => {
    if (publicacion) {
      setLikeCount(publicacion.totalCalificaciones || 0);
    }
  }, [publicacion]);
  useEffect(() => {
    if (!publicacionId) return;

    const unsubscribe = comentariosService.suscribirseAContadorComentarios(
      publicacionId,
      (count) => {
        setRealTimeCommentCount(count);
      },
    );

    return unsubscribe;
  }, [publicacionId]);

  const formatearFecha = (fecha: Date): string => {
    return fecha.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("zip") || tipo.includes("rar")) return "folder-zip";
    if (tipo.includes("word")) return "file-word";
    if (tipo.includes("excel")) return "file-excel";
    if (tipo.includes("presentación") || tipo.includes("powerpoint"))
      return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const esArchivoVisualizable = (archivo: ArchivoPublicacion): boolean => {
    if (archivo.esEnlaceExterno) return true;

    const tipo = archivo.tipoNombre.toLowerCase();
    return (
      tipo.includes("imagen") ||
      tipo.includes("video") ||
      tipo.includes("audio")
    );
  };

  const esDocumentoAbribleExterno = (archivo: ArchivoPublicacion): boolean => {
    if (archivo.esEnlaceExterno) return false;

    const tipo = archivo.tipoNombre.toLowerCase();
    return (
      tipo.includes("word") ||
      tipo.includes("excel") ||
      tipo.includes("presentación") ||
      tipo.includes("powerpoint") ||
      tipo.includes("texto") ||
      tipo.includes("zip") ||
      tipo.includes("rar")
    );
  };

  const esPdf = (archivo: ArchivoPublicacion): boolean => {
    return archivo.tipoNombre.toLowerCase().includes("pdf");
  };

  const getOpeningLabel = (archivo: ArchivoPublicacion): string => {
    if (archivo.esEnlaceExterno) return "Abriendo enlace...";
    if (esPdf(archivo)) return "Abriendo PDF...";
    return "Abriendo archivo...";
  };

  const setTempInlineFileStatus = (
    fileId: string,
    message: string,
    durationMs: number = 2200,
  ) => {
    setInlineFileStatus((prev) => ({ ...prev, [fileId]: message }));
    setTimeout(() => {
      setInlineFileStatus((prev) => ({ ...prev, [fileId]: undefined }));
    }, durationMs);
  };

  const abrirArchivo = async (archivo: ArchivoPublicacion) => {
    if (archivo.esEnlaceExterno) {
      try {
        const canOpen = await Linking.canOpenURL(archivo.webUrl);
        if (canOpen) {
          await Linking.openURL(archivo.webUrl);
        } else {
          showAlert("Error", "No se puede abrir este enlace", "error");
        }
      } catch (error) {
        console.error("Error al abrir enlace:", error);
        showAlert("Error", "No se pudo abrir el enlace", "error");
      }
      return;
    }

    if (esPdf(archivo)) {
      setOpeningFileId(archivo.id);
      setOpeningProgress(0);
      try {
        const cachedPath = await getPdfFromCache(
          archivo.webUrl,
          archivo.titulo,
        );

        if (cachedPath) {
          setOpeningProgress(1);
          const filePath = cachedPath.replace("file://", "");
          if (Platform.OS === "android") {
            await ReactNativeBlobUtil.android.actionViewIntent(
              filePath,
              "application/pdf",
            );
          } else {
            await Linking.openURL(`file://${filePath}`);
          }
        } else {
          
          const downloadedPath = await downloadAndCachePdf(
            archivo.webUrl,
            archivo.titulo,
            (progress) => {
              setOpeningProgress(progress);
            },
          );

          const filePath = downloadedPath.replace("file://", "");
          if (Platform.OS === "android") {
            await ReactNativeBlobUtil.android.actionViewIntent(
              filePath,
              "application/pdf",
            );
          } else {
            await Linking.openURL(`file://${filePath}`);
          }
        }
      } catch (error) {
        console.error("Error al abrir PDF:", error);
        setTempInlineFileStatus(archivo.id, "No se pudo abrir");
      } finally {
        setOpeningFileId(null);
        setOpeningProgress(0);
      }
      return;
    }

    if (esDocumentoAbribleExterno(archivo)) {
      setOpeningFileId(archivo.id);
      setOpeningProgress(0);
      try {
        await openRemoteFileExternally({
          url: archivo.webUrl,
          titulo: archivo.titulo,
          tipoNombre: archivo.tipoNombre,
        });
      } catch (error) {
        console.error("Error al abrir documento:", error);
        setTempInlineFileStatus(archivo.id, "No se pudo abrir");
      } finally {
        setOpeningFileId(null);
        setOpeningProgress(0);
      }
      return;
    }

    if (esArchivoVisualizable(archivo)) {
      const indice = archivos.findIndex((a) => a.id === archivo.id);

      const archivosSerializados = archivos.map((a) => ({
        ...a,
        fechaSubida:
          a.fechaSubida instanceof Date
            ? a.fechaSubida.toISOString()
            : a.fechaSubida,
      }));

      (navigation.navigate as any)("FileGallery", {
        archivos: archivosSerializados,
        indiceInicial: indice,
        materiaNombre,
      });
    } else {
      showAlert(
        "No visualizable",
        "Este tipo de archivo no se puede previsualizar. ¿Deseas descargarlo?",
        "confirm",
        [
          { text: "Cancelar", onPress: () => {}, mode: "text" },
          {
            text: "Descargar",
            onPress: () => descargarArchivo(archivo),
            mode: "contained",
          },
        ],
      );
    }
  };

  const detectarTipoArchivoLocal = (
    mimeType: string,
    nombre: string,
  ): string | null => {
    for (const tipo of tiposArchivo) {
      if (tipo.mimetype.some((m: string) => mimeType && mimeType.includes(m))) {
        return tipo.id;
      }
    }

    const extension = "." + nombre.split(".").pop()?.toLowerCase();
    for (const tipo of tiposArchivo) {
      if (tipo.extensiones.includes(extension)) return tipo.id;
    }
    return null;
  };

  const mostrarDialogoSeleccion = () => {
    setDialogSeleccionVisible(true);
  };

  const agregarArchivo = async () => {
    setDialogSeleccionVisible(false);
    try {
      setFileProcessing(true);
      const archivo = await seleccionarArchivo();
      if (!archivo) return;

      const tipoId = detectarTipoArchivoLocal(
        archivo.mimeType || "",
        archivo.name,
      );
      if (!tipoId) {
        showAlert(
          "Tipo no soportado",
          "El tipo de archivo seleccionado no está soportado.",
          "error",
        );
        return;
      }

      const staged = {
        id: `staged-${Date.now()}`,
        file: archivo,
        tipoId,
        tipoArchivoId: tipoId,
        name: archivo.name,
        esEnlaceExterno: false,
        progreso: 0,
      };
      setStagedAdds((prev) => {
        const nuevo = [...prev, staged];
        return nuevo;
      });
    } catch (error) {
      console.error("Error al agregar archivo (staged):", error);
      showAlert("Error", "No se pudo preparar el archivo", "error");
    } finally {
      setFileProcessing(false);
    }
  };

  const mostrarDialogoEnlace = () => {
    setDialogSeleccionVisible(false);
    setDialogEnlaceVisible(true);
  };

  const agregarEnlace = () => {
    if (!urlEnlace.trim()) {
      showAlert("Error", "La URL es obligatoria", "error");
      return;
    }

    if (!nombreEnlace.trim()) {
      showAlert("Error", "El nombre del enlace es obligatorio", "error");
      return;
    }

    try {
      new URL(urlEnlace);
    } catch {
      showAlert(
        "Error",
        "La URL no es válida. Debe incluir http:// o https://",
        "error",
      );
      return;
    }

    const tipoEnlace = tiposArchivo.find(
      (t) => t.nombre.toLowerCase() === "enlace",
    );

    if (!tipoEnlace) {
      showAlert(
        "Error",
        "No se encontró el tipo de archivo 'Enlace' en la base de datos",
        "error",
      );
      return;
    }

    const staged = {
      id: `staged-${Date.now()}`,
      tipoId: tipoEnlace.id,
      tipoArchivoId: tipoEnlace.id,
      name: nombreEnlace,
      nombreEnlace: nombreEnlace,
      esEnlaceExterno: true,
      url: urlEnlace,
      progreso: 0,
    };

    setStagedAdds((prev) => [...prev, staged]);
    setDialogEnlaceVisible(false);
    setUrlEnlace("");
    setNombreEnlace("");
  };

  const pegarUrlDesdePortapapeles = async () => {
    try {
      const text = (await Clipboard.getStringAsync())?.trim() || "";
      if (!text) {
        showAlert("Portapapeles vacío", "No hay texto para pegar.", "info");
        return;
      }
      setUrlEnlace(text);
    } catch (error) {
      console.error("Error leyendo portapapeles:", error);
      showAlert("Error", "No se pudo leer el portapapeles.", "error");
    }
  };

  const confirmarEliminarArchivo = (archivoId: string) => {
    if (filesMarkedForDelete.includes(archivoId)) {
      setFilesMarkedForDelete((prev) => prev.filter((id) => id !== archivoId));
      return;
    }

    setFileToDeleteId(archivoId);
    setConfirmDeleteFileVisible(true);
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDeleteId) return;
    try {
      setFilesMarkedForDelete((prev) => {
        if (prev.includes(fileToDeleteId)) return prev;
        return [...prev, fileToDeleteId!];
      });
    } catch (err) {
      console.error("Error al marcar archivo para eliminación", err);
      showAlert("Error", "No se pudo marcar el archivo", "error");
    } finally {
      setConfirmDeleteFileVisible(false);
      setFileToDeleteId(null);
    }
  };

  const handleSaveEdits = async () => {
    try {
      setFileProcessing(true);

      await updateDoc(doc(db, "publicaciones", publicacionId), {
        titulo: editTitle,
        descripcion: editDescription,
      });

      if (filesMarkedForDelete.length > 0) {
        await Promise.all(
          filesMarkedForDelete.map((id) => eliminarArchivo(id)),
        );
        setFilesMarkedForDelete([]);
      }

      if (stagedAdds.length > 0) {
        for (let i = 0; i < stagedAdds.length; i++) {
          const s = stagedAdds[i];

          setStagedAdds((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, subiendo: true, progreso: 0 } : item,
            ),
          );

          try {
            const nombreParaGuardar = s.name || s.nombreEnlace || "Archivo";
            const tipoParaGuardar = s.tipoId || s.tipoArchivoId || "";
            if (s.esEnlaceExterno && s.url) {
              await guardarEnlaceExterno(
                publicacionId,
                tipoParaGuardar,
                nombreParaGuardar,
                s.url,
              );
            } else if (s.file) {
              await subirArchivo(
                publicacionId,
                s.file,
                tipoParaGuardar || s.tipoId,
                nombreParaGuardar,
                undefined,
                (prog) => {
                  setStagedAdds((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, progreso: prog } : item,
                    ),
                  );
                },
              );
            }
          } catch (err) {
            showAlert(
              "Error",
              `No se pudo subir ${s.name || s.nombreEnlace || "archivo"}`,
              "error",
            );
          }

          setStagedAdds((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, subiendo: false, progreso: 100 } : item,
            ),
          );
        }
        setStagedAdds([]);
      }

      setEditMode(false);
      await cargarPublicacion();
      showAlert("Éxito", "Publicación actualizada", "success");
    } catch (err) {
      console.error("Error al guardar cambios", err);
      showAlert("Error", "No se pudo guardar los cambios", "error");
    } finally {
      setFileProcessing(false);
    }
  };

  const handleCancelEdit = async () => {
    setEditMode(false);
    setFilesMarkedForDelete([]);
    setStagedAdds([]);
    if (publicacion) {
      setEditTitle(publicacion.titulo);
      setEditDescription(publicacion.descripcion || "");
    }
    try {
      const nuevos = await obtenerArchivosConTipo(publicacionId);
      setArchivos(nuevos);
    } catch (err) {
      console.error("Error al refrescar archivos al cancelar edición", err);
    }
  };

  const handleDeletePublication = async () => {
    try {
      const deletedTitle = publicacion?.titulo || "";
      const deletedAuthor = publicacion?.autorNombre || "";
      const deletedAuthorUid = publicacion?.autorUid || "";
      const wasAdminDelete = isAdmin && !isOwner;

      await eliminarPublicacionYArchivos(publicacionId);

      if (wasAdminDelete && usuario) {
        registrarActividadCliente(
          "publicacion_eliminada",
          `Publicación eliminada por admin`,
          `${usuario.displayName || usuario.email} eliminó la publicación "${deletedTitle}" de ${deletedAuthor}`,
          usuario.uid,
          usuario.displayName || usuario.email || undefined,
          deletedAuthorUid,
          {
            publicacionId,
            tituloPublicacion: deletedTitle,
            autorOriginal: deletedAuthor,
            autorOriginalUid: deletedAuthorUid,
            accion: "eliminacion_admin",
          },
        ).catch((err) => console.warn("Error registrando actividad:", err));
      }

      showAlert("Eliminada", "La publicación fue eliminada", "success", [
        { text: "OK", onPress: () => navigation.goBack(), mode: "contained" },
      ]);
    } catch (err) {
      console.error("Error al eliminar publicación", err);
      showAlert("Error", "No se pudo eliminar la publicación", "error");
    } finally {
      setConfirmDeletePubVisible(false);
    }
  };

  const descargarArchivo = async (archivo: ArchivoPublicacion) => {
    if (archivo.esEnlaceExterno) {
      abrirArchivo(archivo);
      return;
    }

    if (downloadingFileId) {
      showAlert("Descargando", "Ya hay una descarga en progreso", "info");
      return;
    }

    setDownloadingFileId(archivo.id);
    setDownloadProgress(0);

    const result = await downloadsService.descargarArchivo(
      archivo,
      (progress: any) => {
        setDownloadProgress(Math.round(progress.progress * 100));
      },
    );

    setDownloadingFileId(null);
    setDownloadProgress(0);

    if (result.success) {
      if (result.requiresShare && result.shareUri) {
        await downloadsService.compartirArchivo(result.shareUri);
      }
    } else {
      showAlert(
        "Error al descargar",
        result.error || "No se pudo descargar el archivo",
        "error",
      );
    }
  };

  const descargarTodosLosArchivos = async () => {
    if (downloadingAll || downloadingFileId) {
      showAlert("Descargando", "Ya hay una descarga en progreso", "info");
      return;
    }

    const archivosDescargables = archivos.filter((a) => !a.esEnlaceExterno);

    if (archivosDescargables.length === 0) {
      showAlert(
        "Sin archivos",
        "No hay archivos disponibles para descargar",
        "info",
      );
      return;
    }

    const totalBytes = archivosDescargables.reduce(
      (sum, file) => sum + (file.tamanoBytes || 0),
      0,
    );
    const formatBytes = (bytes: number): string => {
      if (!bytes || bytes <= 0) return "No disponible";
      const sizes = ["B", "KB", "MB", "GB"];
      const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        sizes.length - 1,
      );
      const value = bytes / Math.pow(1024, index);
      return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${sizes[index]}`;
    };

    showAlert(
      "Descargar todo",
      `Se descargarán ${archivosDescargables.length} archivo(s).\nTamaño estimado: ${formatBytes(totalBytes)}.`,
      "confirm",
      [
        { text: "Cancelar", onPress: () => {}, mode: "text" },
        {
          text: "Descargar",
          mode: "contained",
          onPress: async () => {
            setAlertVisible(false);
            setDownloadingAll(true);
            setDownloadAllProgress({
              current: 0,
              total: archivosDescargables.length,
              fileName: "",
            });

            const result = await downloadsService.descargarMultiplesArchivos(
              archivosDescargables,
              publicacion?.titulo || "esta publicación",
              (current: number, total: number, fileName: string) => {
                setDownloadAllProgress({
                  current,
                  total,
                  fileName,
                });
              },
            );

            setDownloadingAll(false);
            setDownloadAllProgress(null);

            if (result.success) {
              const documentosCount = result.pendingShare?.length || 0;

              let message = `Se descargaron ${result.downloadedCount} archivo(s) correctamente`;

              if (result.failedCount > 0) {
                message += `\n\n ${result.failedCount} fallaron:\n${result.errors.join(
                  "\n",
                )}`;
              }

              const buttons =
                documentosCount > 0
                  ? [
                      {
                        text: "Cerrar",
                        onPress: () => {},
                        mode: "text" as const,
                      },
                      {
                        text: "Guardar documentos",
                        onPress: async () => {
                          for (const doc of result.pendingShare!) {
                            await downloadsService.compartirArchivo(doc.shareUri);
                          }
                        },
                        mode: "contained" as const,
                      },
                    ]
                  : [
                      {
                        text: "OK",
                        onPress: () => {},
                        mode: "contained" as const,
                      },
                    ];

              showAlert(
                "Descarga completada",
                message,
                result.failedCount > 0 ? "error" : "success",
                buttons,
              );
            } else {
              showAlert(
                "Error",
                "No se pudo descargar ningún archivo. Verifica los permisos y tu conexión.",
                "error",
              );
            }
          },
        },
      ],
    );
  };

  const mostrarDialogoReporte = () => {
    pedirMotivoYContinuar(async (motivo) => {
      await enviarReporte(motivo);
    });
  };

  const enviarReporte = async (motivo: string) => {
    try {
      const exito = await reportarPublicacion(publicacionId, motivo);
      if (exito) {
        showAlert(
          "Reporte enviado",
          "Gracias por tu reporte. Lo revisaremos pronto.",
          "success",
        );
      }
    } catch (error) {
      showAlert(
        "Error",
        "No se pudo enviar el reporte. Intenta de nuevo más tarde.",
        "error",
      );
    }
  };

  const handleCompartirPublicacion = async () => {
    if (!publicacion) return;

    setSharingPublication(true);
    try {
      await compartirPublicacionMejorado({
        publicacionId: publicacion.id,
        titulo: publicacion.titulo,
        descripcion: publicacion.descripcion,
        autorNombre: publicacion.autorNombre,
        materiaNombre,
      });
    } catch (error) {
      console.error("Error al compartir publicación:", error);
      showAlert("Error", "No se pudo compartir la publicación", "error");
    } finally {
      setSharingPublication(false);
    }
  };

  const TextPreview = ({ content }: { content: string }) => {
    return (
      <View style={styles.fullPreviewContainer}>
        <Text
          style={styles.textPreviewText}
          numberOfLines={12}
          ellipsizeMode="tail"
        >
          {content}
        </Text>
      </View>
    );
  };

  const TextFilePreview = ({ url }: { url: string }) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let mounted = true;
      setLoading(true);
      fetch(url)
        .then((res) => res.text())
        .then((txt) => {
          if (mounted) {
            setContent(txt);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounted) {
            setContent("(No se pudo cargar)");
            setLoading(false);
          }
        });
      return () => {
        mounted = false;
      };
    }, [url]);

    if (loading) {
      return (
        <View style={styles.fullPreviewContainer}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return <TextPreview content={content} />;
  };

  const LinkPreview = ({ url }: { url: string }) => {
    const apiKey = "459ba3";
    const screenshotUrl = `https://api.screenshotmachine.com/?key=${apiKey}&url=${encodeURIComponent(
      url,
    )}&dimension=1024x768&format=jpg`;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    return (
      <View style={styles.fullPreviewContainer}>
        {!error ? (
          <>
            <Image
              source={{ uri: screenshotUrl }}
              style={styles.fullPreviewImage}
              resizeMode="cover"
              onLoadStart={() => {
                setLoading(true);
              }}
              onLoadEnd={() => {
                setLoading(false);
              }}
              onError={(e) => {
                console.error(
                  "[PublicationDetail] LinkPreview image onError:",
                  e,
                );
                setError("Error");
              }}
            />
            {loading && (
              <View style={styles.previewLoadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </>
        ) : (
          <View style={styles.iconFallbackContainer}>
            <IconButton
              icon="link-variant"
              size={64}
              iconColor={theme.colors.primary}
              style={{ margin: 0 }}
            />
          </View>
        )}
      </View>
    );
  };

  const renderArchivoPreview = (
    archivo: ArchivoPublicacion,
    isDownloading: boolean = false,
    compact: boolean = false,
  ) => {
    const tipo = archivo.tipoNombre.toLowerCase();
    const icono = obtenerIconoPorTipo(archivo.tipoNombre || "");

    if (archivo.esEnlaceExterno) {
      if (compact) {
        return (
          <View style={styles.iconFallbackContainer}>
            <IconButton icon="link-variant" size={28} iconColor={theme.colors.primary} />
          </View>
        );
      }
      return <LinkPreview url={archivo.webUrl} />;
    }

    if (tipo.includes("imagen")) {
      return (
        <View style={styles.fullPreviewContainer}>
          <Image
            source={{ uri: archivo.webUrl }}
            style={styles.fullPreviewImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          {isDownloading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator
                size={compact ? "small" : "large"}
                color={theme.colors.primary}
              />
              {!compact && (
                <Text style={styles.imageLoadingText}>{downloadProgress}%</Text>
              )}
            </View>
          )}
        </View>
      );
    }

    if (tipo.includes("texto") || tipo.includes("md")) {
      if (compact) {
        return (
          <View style={styles.iconFallbackContainer}>
            <IconButton icon={icono} size={28} iconColor={theme.colors.primary} />
          </View>
        );
      }
      return <TextFilePreview url={archivo.webUrl} />;
    }

    return (
      <View style={styles.iconFallbackContainer}>
        <IconButton
          icon={icono}
          size={compact ? 28 : 64}
          iconColor={theme.colors.primary}
        />
        {isDownloading && (
          <View style={styles.iconLoadingOverlay}>
            <ActivityIndicator
              size={compact ? "small" : "large"}
              color={theme.colors.primary}
            />
            {!compact && (
              <Text style={styles.imageLoadingText}>{downloadProgress}%</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const downloadableFilesCount = archivos.filter(
    (archivo) => !archivo.esEnlaceExterno,
  ).length;

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={displayedMateriaNombre} />

        {publicacion && (
          <Appbar.Action
            icon="share-variant"
            onPress={handleCompartirPublicacion}
            style={{ marginHorizontal: 4 }}
            disabled={sharingPublication}
          />
        )}

        {publicacion &&
          usuario &&
          !canEdit &&
          !canDelete &&
          publicacion.autorUid !== usuario.uid && (
            <Appbar.Action
              icon="flag"
              onPress={mostrarDialogoReporte}
              style={{ marginHorizontal: 4 }}
            />
          )}

        {publicacion && usuario && (canEdit || canDelete) && (
          <View style={{ flexDirection: "row" }}>
            {canEdit && (
              <Appbar.Action
                icon="pencil"
                onPress={() =>
                  (navigation as any).navigate("CreatePublication", {
                    materiaId: publicacion.materiaId,
                    materiaNombre: displayedMateriaNombre,
                    publicacionId: publicacion.id,
                  })
                }
                style={{ marginHorizontal: 4 }}
              />
            )}

            {canDelete && (
              <Appbar.Action
                icon="trash-can"
                onPress={() => setConfirmDeletePubVisible(true)}
                style={{ marginHorizontal: 4 }}
              />
            )}
          </View>
        )}
      </Appbar.Header>

      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        {cargando ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <PublicationDetailSkeleton />
          </ScrollView>
        ) : !publicacion ? (
          <View style={styles.loadingContainer}>
            <Text variant="headlineSmall" style={styles.loadingText}>
              Publicación no encontrada
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 24,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Card style={styles.headerCard}>
                <Card.Content style={styles.headerCardContent}>
                  <View style={styles.autorContainer}>
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
                        backgroundColor={theme.colors.surface}
                      />
                    </View>
                    <View style={styles.autorInfo}>
                      <Text variant="bodyMedium" style={styles.autorNombre}>
                        {publicacion.autorNombre}
                      </Text>
                      <Text variant="bodySmall" style={styles.fecha}>
                        {formatearFecha(publicacion.fechaPublicacion)}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  {!editMode ? (
                    <View>
                      <Text variant="titleMedium" style={styles.titulo}>
                        {publicacion.titulo}
                      </Text>

                      {!!publicacion.descripcion?.trim() && (
                        <Text variant="bodyLarge" style={styles.descripcion}>
                          {publicacion.descripcion}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View>
                      <TextInput
                        label="Título"
                        value={editTitle}
                        onChangeText={setEditTitle}
                        mode="outlined"
                        style={{ marginBottom: 12 }}
                      />
                      <TextInput
                        label="Descripción"
                        value={editDescription}
                        onChangeText={setEditDescription}
                        mode="outlined"
                        style={{ marginBottom: 12 }}
                      />
                    </View>
                  )}

                  <View style={styles.statsRowWithDownload}>
                    {!editMode && downloadableFilesCount > 0 ? (
                      <Chip
                        icon="download-multiple"
                        compact
                        onPress={descargarTodosLosArchivos}
                        disabled={
                          downloadingAll ||
                          downloadingFileId !== null ||
                          downloadableFilesCount === 0
                        }
                        style={styles.downloadChip}
                        textStyle={styles.downloadChipText}
                      >
                        Descargar
                      </Chip>
                    ) : (
                      <View />
                    )}

                    <View style={styles.statsContainer}>
                      <View style={styles.statsInlineItem}>
                        <MaterialCommunityIcons
                          name="eye"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.statsInlineText}>{publicacion.vistas}</Text>
                      </View>

                      <Pressable
                        onPress={() => setCommentsModalVisible(true)}
                        style={({ pressed }) => [
                          styles.statsInlineItem,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="comment"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.statsInlineText}>{realTimeCommentCount}</Text>
                      </Pressable>

                      <Pressable
                        onPress={toggleLike}
                        disabled={likeLoading}
                        style={({ pressed }) => [
                          styles.statsInlineItem,
                          { opacity: likeLoading ? 0.5 : pressed ? 0.7 : 1 },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={userLiked ? "heart" : "heart-outline"}
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.statsInlineText}>{likeCount}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {archivos.length > 0 && (
                <View style={styles.archivosContainer}>
                  <View style={styles.archivosGrid}>
                    {archivos.map((archivo) => {
                      const isMarked = filesMarkedForDelete.includes(
                        archivo.id,
                      );
                      const isDownloading = downloadingFileId === archivo.id;
                      const isOpening = openingFileId === archivo.id;
                      const fileStatusText = inlineFileStatus[archivo.id];
                      return (
                        <View
                          key={archivo.id}
                          style={styles.archivoCardWrapper}
                        >
                          <Card
                            style={[
                              styles.archivoCard,
                              isMarked ? { opacity: 0.45 } : undefined,
                            ]}
                            onPress={() => abrirArchivo(archivo)}
                          >
                            <View style={styles.archivoRow}>
                              <View style={styles.archivoThumb}>
                                {renderArchivoPreview(archivo, isDownloading, true)}
                              </View>

                              <View style={styles.archivoMeta}>
                                <View style={styles.archivoTitleRow}>
                                  <Text
                                    variant="bodyMedium"
                                    style={styles.archivoTitle}
                                    numberOfLines={1}
                                  >
                                    {archivo.titulo}
                                  </Text>
                                </View>
                                <Text
                                  style={styles.archivoSubtitle}
                                  numberOfLines={1}
                                >
                                  {isDownloading
                                    ? `Descargando... ${downloadProgress}%`
                                    : isOpening
                                    ? getOpeningLabel(archivo)
                                    : fileStatusText
                                      ? fileStatusText
                                    : archivo.esEnlaceExterno
                                    ? "Enlace"
                                    : archivo.tipoNombre || "Archivo"}
                                </Text>
                                {isDownloading && (
                                  <ProgressBar
                                    progress={
                                      downloadProgress > 0
                                        ? downloadProgress / 100
                                        : undefined
                                    }
                                    indeterminate={downloadProgress <= 0}
                                    color={theme.colors.primary}
                                    style={styles.downloadingProgressBar}
                                  />
                                )}
                                {isOpening && (
                                  <ProgressBar
                                    progress={openingProgress > 0 ? openingProgress : undefined}
                                    indeterminate={openingProgress <= 0}
                                    color={theme.colors.primary}
                                    style={styles.openingProgressBar}
                                  />
                                )}
                                {isMarked && (
                                  <Text
                                    style={{
                                      color: theme.colors.error,
                                      fontSize: 12,
                                      marginTop: 4,
                                    }}
                                    numberOfLines={1}
                                  >
                                    Se eliminará al guardar
                                  </Text>
                                )}
                              </View>

                              {!editMode ? (
                                <IconButton
                                  icon={archivo.esEnlaceExterno ? "link-variant" : "download"}
                                  size={20}
                                  onPress={() =>
                                    archivo.esEnlaceExterno
                                      ? abrirArchivo(archivo)
                                      : descargarArchivo(archivo)
                                  }
                                  style={styles.archivoTrailing}
                                  iconColor={theme.colors.onSurface}
                                  disabled={isDownloading || isOpening}
                                />
                              ) : (
                                <IconButton
                                  icon={isMarked ? "check" : "close"}
                                  size={18}
                                  onPress={() =>
                                    confirmarEliminarArchivo(archivo.id)
                                  }
                                  style={styles.archivoTrailing}
                                  iconColor={
                                    isMarked
                                      ? theme.colors.primary
                                      : theme.colors.onSurfaceVariant
                                  }
                                />
                              )}
                            </View>
                          </Card>
                        </View>
                      );
                    })}

                    {stagedAdds.map((s, index) => {
                      return (
                        <View key={s.id} style={styles.archivoCardWrapper}>
                          <Card
                            style={[
                              styles.archivoCard,
                            ]}
                          >
                            <View style={styles.archivoRow}>
                              <View style={styles.archivoThumb}>
                                <View style={styles.iconFallbackContainer}>
                                  <IconButton
                                    icon={s.esEnlaceExterno ? "link-variant" : "file-document"}
                                    size={28}
                                    iconColor={theme.colors.primary}
                                    style={{ margin: 0 }}
                                  />
                                </View>
                              </View>

                              <View style={styles.archivoMeta}>
                                <Text
                                  variant="bodyMedium"
                                  style={styles.archivoTitle}
                                  numberOfLines={1}
                                >
                                  {s.name || s.nombreEnlace || s.file?.name || "Nuevo archivo"}
                                </Text>
                                {s.esEnlaceExterno && s.url ? (
                                  <Text style={styles.archivoSubtitle} numberOfLines={1}>
                                    {s.url}
                                  </Text>
                                ) : (
                                  <Text style={styles.archivoSubtitle} numberOfLines={1}>
                                    {s.subiendo
                                      ? `Subiendo... ${s.progreso || 0}%`
                                      : s.progreso === 100
                                        ? "Subido"
                                        : "Pendiente"}
                                  </Text>
                                )}
                              </View>

                              <IconButton
                                icon="close"
                                size={18}
                                onPress={() =>
                                  setStagedAdds((prev) =>
                                    prev.filter((x) => x.id !== s.id),
                                  )
                                }
                                style={styles.archivoTrailing}
                                iconColor={theme.colors.onSurfaceVariant}
                              />
                            </View>
                          </Card>
                        </View>
                      );
                    })}

                    {editMode && (
                      <View style={styles.archivoCardWrapper}>
                        <Card
                          style={[
                            styles.addFileCard,
                            { backgroundColor: theme.colors.elevation.level1 },
                          ]}
                          onPress={mostrarDialogoSeleccion}
                        >
                          <View style={styles.addFileRow}>
                            <IconButton
                              icon="plus"
                              size={20}
                              disabled={fileProcessing}
                              iconColor={theme.colors.primary}
                              style={{ margin: 0 }}
                            />
                            <Text
                              variant="bodyMedium"
                              style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                            >
                              Agregar archivo
                            </Text>
                          </View>
                        </Card>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <CommentsModal
          visible={commentsModalVisible}
          onDismiss={() => setCommentsModalVisible(false)}
          publicacionId={publicacionId}
          autorPublicacionUid={publicacion?.autorUid || ""}
        />

        <ReportReasonModal
          visible={motivoDialogVisible}
          initialSelection={savedMotivo}
          onDismiss={(saved, motivo) => {
            if (saved) {
              setSavedMotivo(motivo || "");
            } else {
              setSavedMotivo("");
            }
            setMotivoDialogVisible(false);
          }}
          onConfirm={async (motivo: string) => {
            if (accionPendiente.current) {
              try {
                await accionPendiente.current(motivo);
              } finally {
                accionPendiente.current = null;
                setMotivoDialogVisible(false);
              }
            } else {
              setMotivoDialogVisible(false);
            }
          }}
        />

        <CustomAlert
          visible={alertVisible}
          onDismiss={() => setAlertVisible(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          buttons={alertButtons}
        />

        <CustomAlert
          visible={confirmDeleteFileVisible}
          onDismiss={() => setConfirmDeleteFileVisible(false)}
          title="Eliminar archivo"
          message="¿Estás seguro que quieres eliminar este archivo? Esta acción no se puede deshacer."
          type="confirm"
          buttons={[
            {
              text: "Cancelar",
              onPress: () => setConfirmDeleteFileVisible(false),
              mode: "text",
            },
            {
              text: "Eliminar",
              onPress: handleConfirmDeleteFile,
              mode: "contained",
              preventDismiss: true,
            },
          ]}
        />

        <CustomAlert
          visible={confirmDeletePubVisible}
          onDismiss={() => setConfirmDeletePubVisible(false)}
          title="Eliminar publicación"
          message={
            isAdmin && !isOwner
              ? `Como administrador, vas a eliminar la publicación "${publicacion?.titulo || ""}" de ${publicacion?.autorNombre || "otro usuario"}. Esta acción no se puede deshacer.`
              : "¿Estás seguro que quieres eliminar esta publicación y todos sus archivos? Esta acción no se puede deshacer."
          }
          type="confirm"
          buttons={[
            {
              text: "Cancelar",
              onPress: () => setConfirmDeletePubVisible(false),
              mode: "text",
            },
            {
              text: "Eliminar",
              onPress: handleDeletePublication,
              mode: "contained",
              preventDismiss: true,
            },
          ]}
        />
        <Portal>
          <Dialog
            visible={dialogSeleccionVisible}
            onDismiss={() => setDialogSeleccionVisible(false)}
          >
            <Dialog.Title>¿Qué deseas adjuntar?</Dialog.Title>
            <Dialog.Content>
              <Button
                mode="contained"
                icon="file-upload"
                onPress={agregarArchivo}
                style={{ marginBottom: 12 }}
              >
                Subir archivo
              </Button>
              <Button
                mode="outlined"
                icon="link-variant"
                onPress={mostrarDialogoEnlace}
              >
                Agregar enlace
              </Button>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogSeleccionVisible(false)}>
                Cancelar
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={dialogEnlaceVisible}
            onDismiss={() => setDialogEnlaceVisible(false)}
          >
            <Dialog.Title>Agregar enlace</Dialog.Title>
            <Dialog.ScrollArea>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 24}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  <TextInput
                    label="Nombre del enlace *"
                    value={nombreEnlace}
                    onChangeText={setNombreEnlace}
                    mode="outlined"
                    style={{ marginBottom: 12 }}
                    placeholder="Ej: Video explicativo"
                  />
                  <TextInput
                    label="URL *"
                    value={urlEnlace}
                    onChangeText={setUrlEnlace}
                    mode="outlined"
                    placeholder="https://ejemplo.com"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                    <Button
                      mode="text"
                      icon="content-paste"
                      compact
                      onPress={pegarUrlDesdePortapapeles}
                    >
                      Pegar
                    </Button>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setDialogEnlaceVisible(false)}>
                Cancelar
              </Button>
              <Button onPress={agregarEnlace}>Agregar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            visible={downloadingAll && downloadAllProgress !== null}
            dismissable={false}
          >
            <Dialog.Title>Descargando archivos</Dialog.Title>
            <Dialog.Content>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
              {downloadAllProgress && (
                <View>
                  <Text
                    variant="bodyLarge"
                    style={{ textAlign: "center", marginBottom: 8 }}
                  >
                    Descargando {downloadAllProgress.current} de{" "}
                    {downloadAllProgress.total}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      textAlign: "center",
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {downloadAllProgress.fileName}
                  </Text>
                </View>
              )}
            </Dialog.Content>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </View>
  );
}
