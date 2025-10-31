import { CommentInput, CommentList } from "@/app/components/comments";
import { PublicationActions } from "@/app/components/publications/PublicationActions";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import {
  incrementarVistas,
  obtenerArchivosConTipo,
  obtenerPublicacionPorId,
} from "@/scripts/services/Publications";
import {
  ArchivoPublicacion,
  Publicacion,
} from "@/scripts/types/Publication.type";
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
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStyles } from "./_PublicationDetailScreen.styles";

const reportarPublicacion = async (
  publicacionId: string,
  motivo: string
): Promise<boolean> => {
  try {
    const auth = getAuth();
    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert("Error", "Debes iniciar sesión para reportar");
      return false;
    }

    const reportesExistentes = await getDocs(
      query(
        collection(db, "reportes"),
        where("publicacionUid", "==", publicacionId),
        where("autorUid", "==", usuario.uid)
      )
    );

    if (!reportesExistentes.empty) {
      Alert.alert(
        "Ya reportaste esta publicación",
        "No puedes reportar la misma publicación más de una vez"
      );
      return false;
    }

    await addDoc(collection(db, "reportes"), {
      publicacionUid: publicacionId,
      autorUid: usuario.uid,
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
  const [showComments, setShowComments] = useState(false);
  const [commentsUpdated, setCommentsUpdated] = useState(0);
  const [userLiked, setUserLiked] = useState(false);

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

  const handleCommentsUpdated = () => {
    setCommentsUpdated((prev) => prev + 1);
  };

  const handleCommentAdded = useCallback(() => {
    handleCommentsUpdated();
    setShowComments(false);
  }, [handleCommentsUpdated]);

  const handleCommentPress = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

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
          Alert.alert("Error", "No se puede abrir este enlace");
        }
      } catch (error) {
        console.error("Error al abrir enlace:", error);
        Alert.alert("Error", "No se pudo abrir el enlace");
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
      Alert.alert(
        "No visualizable",
        "Este tipo de archivo no se puede previsualizar. ¿Deseas descargarlo?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Descargar",
            onPress: () => descargarArchivo(archivo),
          },
        ]
      );
    }
  };

  const descargarArchivo = (archivo: ArchivoPublicacion) => {
    if (archivo.esEnlaceExterno) {
      abrirArchivo(archivo);
      return;
    }

    Alert.alert("Descargar", `¿Descargar ${archivo.titulo}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descargar",
        onPress: () => {
          Alert.alert(
            "Info",
            "La función de descarga estará disponible próximamente"
          );
        },
      },
    ]);
  };

  const mostrarDialogoReporte = () => {
    Alert.alert(
      "Reportar Publicación",
      "¿Por qué deseas reportar esta publicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Spam",
          onPress: () => enviarReporte("Spam"),
        },
        {
          text: "Contenido inapropiado",
          onPress: () => enviarReporte("Contenido inapropiado"),
        },
        {
          text: "Acoso o bullying",
          onPress: () => enviarReporte("Acoso o bullying"),
        },
        {
          text: "Información falsa",
          onPress: () => enviarReporte("Información falsa"),
        },
        {
          text: "Otro",
          onPress: () => enviarReporte("Otro"),
        },
      ],
      { cancelable: true }
    );
  };

  const enviarReporte = async (motivo: string) => {
    try {
      const exito = await reportarPublicacion(publicacionId, motivo);
      if (exito) {
        Alert.alert(
          "Reporte enviado",
          "Gracias por tu reporte. Lo revisaremos pronto.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo enviar el reporte. Intenta de nuevo más tarde."
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
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => setError("Error")}
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

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={materiaNombre} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando publicación...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!publicacion) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={materiaNombre} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text variant="headlineSmall" style={styles.loadingText}>
            Publicación no encontrada
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={materiaNombre} />
        {publicacion && usuario && publicacion.autorUid !== usuario.uid && (
          <Appbar.Action icon="flag" onPress={mostrarDialogoReporte} />
        )}
      </Appbar.Header>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : showComments
            ? "height"
            : undefined
        }
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <CommentList
          publicacionId={publicacion.id}
          reloadTrigger={commentsUpdated}
          autorPublicacionUid={publicacion.autorUid}
          headerComponent={
            <>
              {/* Contenido de la publicación */}
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
                          publicacion.autorNombre?.charAt(0).toUpperCase() ||
                          "?"
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

                  <Text variant="headlineSmall" style={styles.titulo}>
                    {publicacion.titulo}
                  </Text>

                  <Text variant="bodyLarge" style={styles.descripcion}>
                    {publicacion.descripcion}
                  </Text>

                  <View style={styles.statsContainer}>
                    <Chip
                      icon="eye"
                      compact
                      style={styles.statChip}
                      textStyle={styles.statText}
                    >
                      {publicacion.vistas}
                    </Chip>
                    {publicacion.totalComentarios > 0 && (
                      <Chip
                        icon="comment"
                        compact
                        style={styles.statChip}
                        textStyle={styles.statText}
                      >
                        {publicacion.totalComentarios}
                      </Chip>
                    )}
                    {publicacion.totalCalificaciones > 0 && (
                      <Chip
                        icon="heart"
                        compact
                        style={styles.statChip}
                        textStyle={styles.statText}
                      >
                        {publicacion.totalCalificaciones}
                      </Chip>
                    )}
                  </View>
                  <Divider style={styles.actionsDivider} />
                  <PublicationActions
                    publicacionId={publicacion.id}
                    onCommentPress={handleCommentPress}
                    initialLikes={publicacion.totalCalificaciones}
                    initialLiked={userLiked}
                  />
                </Card.Content>
              </Card>

              {/* Archivos adjuntos */}
              {archivos.length > 0 && (
                <View style={styles.archivosContainer}>
                  <Text variant="titleMedium" style={styles.archivosTitle}>
                    Archivos adjuntos ({archivos.length})
                  </Text>

                  <View style={styles.archivosGrid}>
                    {archivos.map((archivo) => (
                      <View key={archivo.id} style={styles.archivoCardWrapper}>
                        <Card
                          style={styles.archivoCard}
                          onPress={() => abrirArchivo(archivo)}
                          onLongPress={() => descargarArchivo(archivo)}
                        >
                          {!archivo.esEnlaceExterno && (
                            <IconButton
                              icon="download"
                              size={18}
                              onPress={(e) => {
                                e.stopPropagation();
                                descargarArchivo(archivo);
                              }}
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

                          {renderArchivoPreview(archivo)}
                        </Card>

                        <View style={styles.archivoInfoContainer}>
                          <View style={styles.archivoInfoRow}>
                            <IconButton
                              icon={obtenerIconoPorTipo(
                                archivo.tipoNombre || ""
                              )}
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
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          }
          footerComponent={
            showComments ? (
              <View style={{ backgroundColor: theme.colors.background }}>
                <Divider />
                <CommentInput
                  publicacionId={publicacion.id}
                  onCommentAdded={handleCommentAdded}
                  autoFocus={true}
                  onCancel={() => setShowComments(false)}
                  showCancelButton={true}
                />
              </View>
            ) : undefined
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
