import { useTheme } from "@/contexts/ThemeContext";
import {
  incrementarVistas,
  obtenerArchivosConTipo,
  obtenerPublicacionPorId,
} from "@/scripts/services/Publications";
import { ArchivoPublicacion, Publicacion } from "@/scripts/types/Publication.type";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
} from "react-native-paper";
import { getStyles } from "./PublicationDetailScreen.styles";

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

  useEffect(() => {
    cargarPublicacion();
  }, [publicacionId]);

  const cargarPublicacion = async () => {
    setCargando(true);
    const pub = await obtenerPublicacionPorId(publicacionId);
    if (pub) {
      setPublicacion(pub);
      await incrementarVistas(publicacionId);
      
      const archivosData = await obtenerArchivosConTipo(publicacionId);
      setArchivos(archivosData);
    }
    setCargando(false);
  };

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
    if (tipo.includes("zip")) return "folder-zip";
    if (tipo.includes("word") || tipo.includes("doc")) return "file-word";
    if (tipo.includes("excel") || tipo.includes("xls")) return "file-excel";
    if (tipo.includes("powerpoint") || tipo.includes("ppt")) return "file-powerpoint";
    return "file-document";
  };

  const abrirGaleria = (archivo: ArchivoPublicacion) => {
    const indice = archivos.findIndex((a) => a.id === archivo.id);
    // @ts-ignore
    navigation.navigate("FileGallery" as never, {
      archivos,
      indiceInicial: indice,
      materiaNombre,
    } as never);
  };

  const descargarArchivo = (archivo: ArchivoPublicacion) => {
    Alert.alert(
      "Descargar",
      `¿Descargar ${archivo.titulo}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Descargar", 
          onPress: () => {
            Alert.alert("Info", "La función de descarga estará disponible próximamente");
          }
        }
      ]
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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {publicacion.autorNombre.charAt(0).toUpperCase()}
                </Text>
              </View>
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
                <Card
                  key={archivo.id}
                  style={styles.archivoCard}
                  onPress={() => abrirGaleria(archivo)}
                  onLongPress={() => descargarArchivo(archivo)}
                >
                  {/* Botón de descarga */}
                  <IconButton
                    icon="download"
                    size={18}
                    onPress={(e) => {
                      descargarArchivo(archivo);
                    }}
                    style={styles.downloadButton}
                    iconColor={theme.colors.onSurfaceVariant}
                  />
                  
                  <Card.Content>
                    <View style={styles.archivoIconContainer}>
                      <IconButton
                        icon={obtenerIconoPorTipo(archivo.tipoNombre || "")}
                        size={40}
                        iconColor={theme.colors.primary}
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
                      <Text variant="bodySmall" style={styles.archivoTamano}>
                        {formatearTamano(archivo.tamanoBytes)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
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