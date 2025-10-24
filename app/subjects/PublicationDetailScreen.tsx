import { useTheme } from "@/contexts/ThemeContext";
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
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Linking, ScrollView, View } from "react-native";
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
import { getStyles } from "./_PublicationDetailScreen.styles";

export default function PublicationDetailScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();

  const params = route.params as {
    publicacionId?: string;
    materiaNombre?: string;
  };

  const publicacionId = params?.publicacionId || "";
  const materiaNombre = params?.materiaNombre || "Materia";

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [archivos, setArchivos] = useState<ArchivoPublicacion[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPublicacion = useCallback(async () => {
    setCargando(true);
    const pub = await obtenerPublicacionPorId(publicacionId);
    if (pub) {
      setPublicacion(pub);
      await incrementarVistas(publicacionId);
      const archivosData = await obtenerArchivosConTipo(publicacionId);
      setArchivos(archivosData);
    }
    setCargando(false);
  }, [publicacionId]);

  useEffect(() => {
    cargarPublicacion();
  }, [cargarPublicacion]);

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

  // Renderizar preview o icono del archivo
  const renderArchivoPreview = (archivo: ArchivoPublicacion) => {
    const tipo = archivo.tipoNombre.toLowerCase();
    const icono = obtenerIconoPorTipo(archivo.tipoNombre || "");

    // Preview de enlace externo
    if (archivo.esEnlaceExterno) {
      return <LinkPreview url={archivo.webUrl} />;
    }

    // Preview de imagen
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

    // Preview de archivo de texto
    if (tipo.includes("texto") || tipo.includes("md")) {
      return <TextFilePreview url={archivo.webUrl} />;
    }

    // Icono grande para otros tipos
    return (
      <View style={styles.iconFallbackContainer}>
        <IconButton icon={icono} size={64} iconColor={theme.colors.primary} />
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  if (!publicacion) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={materiaNombre} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text variant="headlineSmall" style={styles.loadingText}>
            Publicación no encontrada
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={materiaNombre} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Encabezado de la publicación */}
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
            </View>
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
                  {/* Card con preview/icono que ocupa todo el espacio */}
                  <Card
                    style={styles.archivoCard}
                    onPress={() => abrirArchivo(archivo)}
                    onLongPress={() => descargarArchivo(archivo)}
                  >
                    {/* Botón de descarga */}
                    {!archivo.esEnlaceExterno && (
                      <IconButton
                        icon="download"
                        size={18}
                        onPress={(e) => {
                          descargarArchivo(archivo);
                        }}
                        style={styles.downloadButton}
                        iconColor={theme.colors.onSurface}
                      />
                    )}

                    {/* Icono de enlace externo */}
                    {archivo.esEnlaceExterno && (
                      <IconButton
                        icon="link-variant"
                        size={18}
                        style={styles.downloadButton}
                        iconColor={theme.colors.onSurface}
                        onPress={() => {}}
                      />
                    )}

                    {/* Preview o icono que ocupa todo el card */}
                    {renderArchivoPreview(archivo)}
                  </Card>

                  {/* Información debajo del card */}
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
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sección de comentarios (placeholder) */}
        <Card style={styles.comentariosCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.comentariosTitle}>
              Comentarios
            </Text>
            <Text variant="bodyMedium" style={styles.comentariosPlaceholder}>
              Los comentarios estarán disponibles próximamente
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}