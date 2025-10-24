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
import { Alert, Linking, ScrollView, View } from "react-native";
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

  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("zip") || tipo.includes("rar")) return "folder-zip";
    if (tipo.includes("word")) return "file-word";
    if (tipo.includes("excel")) return "file-excel";
    if (tipo.includes("presentación") || tipo.includes("powerpoint")) return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const esArchivoVisualizable = (archivo: ArchivoPublicacion): boolean => {
    // Enlaces externos siempre se pueden "visualizar" (abrir en navegador)
    if (archivo.esEnlaceExterno) return true;
    
    const tipo = archivo.tipoNombre.toLowerCase();
    
    // Tipos visualizables
    if (tipo.includes("pdf")) return true;
    if (tipo.includes("imagen")) return true;
    if (tipo.includes("video")) return true;
    if (tipo.includes("audio")) return true;
    if (tipo.includes("word")) return true;
    // if (tipo.includes("excel")) return true;
    if (tipo.includes("presentación") || tipo.includes("powerpoint")) return true;
    if (tipo.includes("texto")) return true;
    
    // No visualizables (ZIP, RAR, etc.)
    return false;
  };

  const abrirArchivo = async (archivo: ArchivoPublicacion) => {
    // Si es un enlace externo, abrirlo en el navegador
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

    // Si es visualizable, ir a la galería
    if (esArchivoVisualizable(archivo)) {
      const indice = archivos.findIndex((a) => a.id === archivo.id);

      // Serializar archivos para navegación
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
      // Si no es visualizable
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
    // Si es un enlace externo, abrirlo directamente
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
              {archivos.map((archivo) => {
                const icono = obtenerIconoPorTipo(archivo.tipoNombre || "");
                const visualizable = esArchivoVisualizable(archivo);
                
                return (
                  <Card
                    key={archivo.id}
                    style={styles.archivoCard}
                    onPress={() => abrirArchivo(archivo)}
                    onLongPress={() => descargarArchivo(archivo)}
                  >
                    {/* Botón de descarga - solo para archivos, no enlaces */}
                    {!archivo.esEnlaceExterno && (
                      <IconButton
                        icon="download"
                        size={18}
                        onPress={(e) => {
                          descargarArchivo(archivo);
                        }}
                        style={styles.downloadButton}
                        iconColor={theme.colors.onSurfaceVariant}
                      />
                    )}

                    {/* Badge para enlaces externos */}
                    {archivo.esEnlaceExterno && (
                      <Chip
                        compact
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          height: 24,
                        }}
                        textStyle={{ fontSize: 10 }}
                        icon="link-variant"
                      >
                        Enlace
                      </Chip>
                    )}

                    <Card.Content>
                      <View style={styles.archivoIconContainer}>
                        <IconButton
                          icon={icono}
                          size={40}
                          iconColor={
                            archivo.esEnlaceExterno
                              ? theme.colors.secondary
                              : theme.colors.primary
                          }
                        />
                      </View>

                      <View style={styles.archivoInfo}>
                        <Text
                          variant="bodyMedium"
                          style={styles.archivoNombre}
                          numberOfLines={2}
                        >
                          {archivo.titulo}
                        </Text>
                        
                        {/* Mostrar tamaño solo si no es enlace externo */}
                        {!archivo.esEnlaceExterno && (
                          <Text variant="bodySmall" style={styles.archivoTamano}>
                            {formatearTamano(archivo.tamanoBytes)}
                          </Text>
                        )}
                        
                        {/* Mostrar badge de tipo */}
                        <Chip
                          compact
                          style={{ marginTop: 4, alignSelf: 'flex-start' }}
                          textStyle={{ fontSize: 11 }}
                        >
                          {archivo.tipoNombre}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
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