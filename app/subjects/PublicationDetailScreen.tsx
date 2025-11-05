import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
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
import { comentariosService } from "@/services/comments.service";
import { likesService } from "@/services/likes.service";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
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
  ScrollView,
  View,
} from "react-native";
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
import { getStyles } from "./_PublicationDetailScreen.styles";

const { width } = Dimensions.get("window");

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
  const [archivos, setArchivos] = useState<ArchivoPublicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [tiposArchivo, setTiposArchivo] = useState<any[]>([]);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [confirmDeleteFileVisible, setConfirmDeleteFileVisible] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);
  const [filesMarkedForDelete, setFilesMarkedForDelete] = useState<string[]>([]);
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
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[] | undefined>(undefined);
  const [motivoDialogVisible, setMotivoDialogVisible] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>("");
  const accionPendiente = React.useRef<null | ((motivo: string) => Promise<void>)>(null);
  const [savedMotivo, setSavedMotivo] = useState<string>("");

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

  const showAlert = (
    title: string | undefined,
    message: string,
    type: CustomAlertType = "info",
    buttons?: CustomAlertButton[]
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
      ]
    );
    setAlertVisible(true);
  };

  const reportarPublicacion = async (
    publicacionId: string,
    motivo: string
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
          where("autorUid", "==", usuarioLocal.uid)
        )
      );

      if (!reportesExistentes.empty) {
        showAlert(
          "Ya reportaste esta publicación",
          "No puedes reportar la misma publicación más de una vez",
          "info"
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

      return true;
    } catch (error) {
      console.error("Error al reportar publicación:", error);
      throw error;
    }
  };

  const cargarPublicacion = useCallback(async () => {
    setCargando(true);
    try {
      const pub = await obtenerPublicacionPorId(publicacionId);
      if (pub) {
        setPublicacion(pub);
        await incrementarVistas(publicacionId);
        const archivosData = await obtenerArchivosConTipo(publicacionId);
        setArchivos(archivosData);
        if (usuario) {
          const likeQuery = query(
            collection(db, "likes"),
            where("publicacionId", "==", publicacionId),
            where("autorUid", "==", usuario.uid)
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
          setPublicacion({
            id: doc.id,
            ...data,
            fechaPublicacion: data.fechaPublicacion.toDate(),
          } as Publicacion);
        }
      }
    );
    return () => unsubscribe();
  }, [publicacionId]);

  useEffect(() => {
    if (!publicacionId) return;
    const q = query(
      collection(db, "archivos"),
      where("publicacionId", "==", publicacionId),
      where("activo", "==", true)
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
      where("autorUid", "==", usuario.uid)
    );
    const unsubscribe = onSnapshot(likeQuery, (snapshot) => {
      setUserLiked(!snapshot.empty);
    });
    return () => unsubscribe();
  }, [publicacionId, usuario]);

  useEffect(() => {
    cargarPublicacion();
  }, [cargarPublicacion]);

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
      where("publicacionId", "==", publicacionId)
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
      }
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
      tipo.includes("pdf") ||
      tipo.includes("imagen") ||
      tipo.includes("video") ||
      tipo.includes("audio") ||
      tipo.includes("word") ||
      tipo.includes("presentación") ||
      tipo.includes("powerpoint") ||
      tipo.includes("texto")
    );
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
        ]
      );
    }
  };

  const detectarTipoArchivoLocal = (
    mimeType: string,
    nombre: string
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
        archivo.name
      );
      if (!tipoId) {
        showAlert(
          "Tipo no soportado",
          "El tipo de archivo seleccionado no está soportado.",
          "error"
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
        "error"
      );
      return;
    }

    const tipoEnlace = tiposArchivo.find((t) => t.nombre.toLowerCase() === "enlace");
    
    if (!tipoEnlace) {
      showAlert(
        "Error",
        "No se encontró el tipo de archivo 'Enlace' en la base de datos",
        "error"
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
          filesMarkedForDelete.map((id) => eliminarArchivo(id))
        );
        setFilesMarkedForDelete([]);
      }

      if (stagedAdds.length > 0) {
        for (let i = 0; i < stagedAdds.length; i++) {
          const s = stagedAdds[i];

          setStagedAdds((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, subiendo: true, progreso: 0 } : item
            )
          );

          try {
            const nombreParaGuardar = s.name || s.nombreEnlace || "Archivo";
            const tipoParaGuardar = s.tipoId || s.tipoArchivoId || "";
            if (s.esEnlaceExterno && s.url) {
              await guardarEnlaceExterno(
                publicacionId,
                tipoParaGuardar,
                nombreParaGuardar,
                s.url
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
                      idx === i ? { ...item, progreso: prog } : item
                    )
                  );
                }
              );
            }
          } catch (err) {
            showAlert("Error", `No se pudo subir ${s.name || s.nombreEnlace || "archivo"}`, "error");
          }

          setStagedAdds((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, subiendo: false, progreso: 100 } : item
            )
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
      await eliminarPublicacionYArchivos(publicacionId);
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

  const descargarArchivo = (archivo: ArchivoPublicacion) => {
    if (archivo.esEnlaceExterno) {
      abrirArchivo(archivo);
      return;
    }

    showAlert("Descargar", `¿Descargar ${archivo.titulo}?`, "confirm", [
      { text: "Cancelar", onPress: () => {}, mode: "text" },
      {
        text: "Descargar",
        onPress: () => {
          showAlert(
            "Info",
            "La función de descarga estará disponible próximamente",
            "info"
          );
        },
        mode: "contained",
      },
    ]);
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
          "success"
        );
      }
    } catch (error) {
      showAlert(
        "Error",
        "No se pudo enviar el reporte. Intenta de nuevo más tarde.",
        "error"
      );
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
      url
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
                console.error("[PublicationDetail] LinkPreview image onError:", e);
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

  const renderArchivoPreview = (archivo: ArchivoPublicacion) => {
    const tipo = archivo.tipoNombre.toLowerCase();
    const icono = obtenerIconoPorTipo(archivo.tipoNombre || "");

    if (archivo.esEnlaceExterno) {
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
        </View>
      );
    }

    if (tipo.includes("texto") || tipo.includes("md")) {
      return <TextFilePreview url={archivo.webUrl} />;
    }

    return (
      <View style={styles.iconFallbackContainer}>
        <IconButton icon={icono} size={64} iconColor={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={materiaNombre} />
        
        {publicacion && usuario && publicacion.autorUid !== usuario.uid && (
          <Appbar.Action
            icon="flag"
            onPress={mostrarDialogoReporte}
            style={{ marginHorizontal: 4 }}
          />
        )}

        {publicacion && usuario && publicacion.autorUid === usuario.uid && (
          <View style={{ flexDirection: 'row' }}>
            {!editMode ? (
              <Appbar.Action
                icon="pencil"
                onPress={() => {
                  setEditMode(true);
                  setEditTitle(publicacion.titulo);
                  setEditDescription(publicacion.descripcion || "");
                }}
                style={{ marginHorizontal: 4 }}
              />
            ) : (
              <View style={{ flexDirection: 'row' }}>
                <Appbar.Action
                  icon="close"
                  onPress={handleCancelEdit}
                  style={{ marginHorizontal: 4 }}
                />
                <Appbar.Action
                  icon="content-save"
                  onPress={handleSaveEdits}
                  style={{ marginHorizontal: 4 }}
                />
              </View>
            )}

            <Appbar.Action
              icon="trash-can"
              onPress={() => setConfirmDeletePubVisible(true)}
              style={{ marginHorizontal: 4 }}
            />
          </View>
        )}
      </Appbar.Header>
      
      <SafeAreaView
        style={styles.container}
        edges={["bottom", "left", "right"]}
      >
        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Cargando publicación...
            </Text>
          </View>
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
              paddingBottom: 24 
            }}
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.headerCard}>
              <Card.Content>
                <View style={styles.autorContainer}>
                  {publicacion.autorFoto ? (
                    <Avatar.Image
                      size={48}
                      source={{ uri: publicacion.autorFoto }}
                    />
                  ) : (
                    <Avatar.Text
                      size={48}
                      label={
                        publicacion.autorNombre?.charAt(0).toUpperCase() || "?"
                      }
                    />
                  )}
                  <View style={styles.autorInfo}>
                    <Text variant="titleMedium" style={styles.autorNombre}>
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
                    <Text variant="headlineSmall" style={styles.titulo}>
                      {publicacion.titulo}
                    </Text>

                    <Text variant="bodyLarge" style={styles.descripcion}>
                      {publicacion.descripcion}
                    </Text>
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

                <View style={styles.statsContainer}>
                  <Chip
                    icon="eye"
                    compact
                    style={styles.statChip}
                    textStyle={styles.statText}
                  >
                    {publicacion.vistas}
                  </Chip>

                  <Chip
                    icon="comment"
                    compact
                    style={styles.statChip}
                    textStyle={styles.statText}
                    onPress={() => setCommentsModalVisible(true)}
                  >
                    {realTimeCommentCount}
                  </Chip>
                  
                  <Chip
                    icon={userLiked ? "heart" : "heart-outline"}
                    compact
                    style={styles.statChip}
                    textStyle={styles.statText}
                    onPress={toggleLike}
                    disabled={likeLoading}
                  >
                    {likeCount}
                  </Chip>
                </View>
              </Card.Content>
            </Card>

            {archivos.length > 0 && (
              <View style={styles.archivosContainer}>
                <Text variant="titleMedium" style={styles.archivosTitle}>
                  Archivos adjuntos ({archivos.length})
                </Text>

                <View style={styles.archivosGrid}>
                  {archivos.map((archivo) => {
                    const isMarked = filesMarkedForDelete.includes(archivo.id);
                    return (
                      <View key={archivo.id} style={styles.archivoCardWrapper}>
                        <Card
                          style={[
                            styles.archivoCard,
                            { position: "relative" },
                            isMarked ? { opacity: 0.45 } : undefined,
                          ]}
                          onPress={() => abrirArchivo(archivo)}
                          onLongPress={() => descargarArchivo(archivo)}
                        >
                          {!editMode ? (
                            <View>
                              {!archivo.esEnlaceExterno && (
                                <IconButton
                                  icon="download"
                                  size={18}
                                  onPress={() => descargarArchivo(archivo)}
                                  style={styles.downloadButton}
                                  iconColor={theme.colors.onSurface}
                                />
                              )}

                              {archivo.esEnlaceExterno && (
                                <IconButton
                                  icon="link-variant"
                                  size={18}
                                  style={styles.downloadButton}
                                  iconColor={theme.colors.onSurface}
                                  onPress={() => {}}
                                />
                              )}
                            </View>
                          ) : (
                            <IconButton
                              icon={isMarked ? "check" : "close"}
                              size={16}
                              onPress={() => confirmarEliminarArchivo(archivo.id)}
                              style={{
                                margin: 0,
                                position: "absolute",
                                top: 6,
                                right: 6,
                                backgroundColor: theme.colors.primary,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 50,
                                elevation: 6,
                              }}
                              iconColor={theme.colors.onPrimary || "#fff"}
                            />
                          )}

                          {renderArchivoPreview(archivo)}
                        </Card>

                        <View style={styles.archivoInfoContainer}>
                          <View style={styles.archivoInfoRow}>
                            <IconButton
                              icon={obtenerIconoPorTipo(archivo.tipoNombre || "")}
                              size={20}
                              iconColor={theme.colors.primary}
                              style={{ margin: 0, marginRight: 4 }}
                            />
                            <Text
                              variant="bodyMedium"
                              style={styles.archivoTitulo}
                              numberOfLines={2}
                            >
                              {archivo.titulo}
                            </Text>
                          </View>
                          {isMarked && (
                            <Text
                              style={{
                                color: theme.colors.error,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              Marcado para eliminar (se eliminará al guardar)
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {stagedAdds.map((s, index) => {   
                    return (
                    <View key={s.id} style={styles.archivoCardWrapper}>
                      <Card style={[styles.archivoCard, { position: "relative" }]}>
                        <IconButton
                          icon="close"
                          size={16}
                          onPress={() =>
                            setStagedAdds((prev) => prev.filter((x) => x.id !== s.id))
                          }
                          style={{
                            margin: 0,
                            position: "absolute",
                            top: 6,
                            right: 6,
                            backgroundColor: theme.colors.primary,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 50,
                            elevation: 6,
                          }}
                          iconColor={theme.colors.onPrimary || "#fff"}
                        />

                        <View style={{ padding: 12, alignItems: "center" }}>
                          <IconButton
                            icon={s.esEnlaceExterno ? "link-variant" : "file-document"}
                            size={24}
                            iconColor={theme.colors.primary}
                            style={{ margin: 0 }}
                          />
                          <Text
                            variant="bodyMedium"
                            style={{
                              textAlign: "center",
                              marginTop: 4,
                              color: theme.colors.onSurface,
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            onLayout={(event) => {
                              const { width, height } = event.nativeEvent.layout;
                            }}
                          >
                            {(() => {
                              const texto = s.name || s.nombreEnlace || s.file?.name || "Nuevo archivo";
                              return texto;
                            })()}
                          </Text>
                          {s.esEnlaceExterno && s.url && (
                            <Text
                              style={{
                                color: theme.colors.secondary,
                                fontSize: 11,
                                marginTop: 2,
                              }}
                              numberOfLines={1}
                            >
                              {s.url}
                            </Text>
                          )}
                          {s.subiendo ? (
                            <>
                              <Text
                                style={{
                                  color: theme.colors.primary,
                                  fontSize: 12,
                                  marginTop: 4,
                                }}
                              >
                                Subiendo... {s.progreso || 0}%
                              </Text>
                            </>
                          ) : (
                            <Text
                              style={{
                                color: theme.colors.primary,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              {s.progreso === 100 ? "Subido ✓" : ""}
                            </Text>
                          )}
                        </View>
                      </Card>

                      <View style={styles.archivoInfoContainer} />
                    </View>
                    );
                  })}

                  {editMode && (
                    <View style={styles.archivoCardWrapper}>
                      <View
                        style={[
                          styles.archivoCard,
                          {
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "transparent",
                            elevation: 0,
                            shadowColor: "transparent",
                            borderWidth: 0,
                          },
                        ]}
                      >
                        <IconButton
                          icon="plus"
                          size={28}
                          onPress={mostrarDialogoSeleccion}
                          disabled={fileProcessing}
                          style={{
                            backgroundColor: theme.colors.primary,
                            width: width * 0.15,
                            height: width * 0.15,
                            borderRadius: 28,
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                          iconColor={theme.colors.onPrimary}
                        />
                      </View>
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
          message="¿Estás seguro que quieres eliminar esta publicación y todos sus archivos? Esta acción no se puede deshacer."
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
            <Dialog.Content>
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
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogEnlaceVisible(false)}>
                Cancelar
              </Button>
              <Button onPress={agregarEnlace}>Agregar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </View>
  );
}