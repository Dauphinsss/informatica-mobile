import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Appbar,
  Card,
  Text,
  ActivityIndicator,
  Chip,
  IconButton,
  Divider,
} from "react-native-paper";
import {
  obtenerPublicacionPorId,
  incrementarVistas,
} from "@/scripts/services/Publications";
import { obtenerArchivosConTipo } from "@/scripts/services/Publications";
import { Publicacion, ArchivoPublicacion } from "@/scripts/types/Publication.type";
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
      
      // Cargar archivos
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
    return "file-document";
  };

  const obtenerColorPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "#D32F2F";
    if (tipo.includes("imagen")) return "#1976D2";
    if (tipo.includes("video")) return "#7B1FA2";
    if (tipo.includes("zip")) return "#F57C00";
    return theme.colors.primary;
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
              <Chip icon="eye" compact style={styles.statChip}>
                {publicacion.vistas} vistas
              </Chip>
              {publicacion.totalComentarios > 0 && (
                <Chip icon="comment" compact style={styles.statChip}>
                  {publicacion.totalComentarios}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Archivos adjuntos */}
        {archivos.length > 0 && (
          <Card style={styles.archivosCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.archivosTitle}>
                Archivos adjuntos ({archivos.length})
              </Text>
            </Card.Content>

            {archivos.map((archivo, index) => (
              <View key={archivo.id}>
                {index > 0 && <Divider />}
                <Card.Content style={styles.archivoItem}>
                  <View style={styles.archivoContent}>
                    <View
                      style={[
                        styles.archivoIconContainer,
                        { backgroundColor: obtenerColorPorTipo(archivo.tipoNombre || "") + "20" },
                      ]}
                    >
                      <IconButton
                        icon={obtenerIconoPorTipo(archivo.tipoNombre || "")}
                        size={28}
                        iconColor={obtenerColorPorTipo(archivo.tipoNombre || "")}
                        style={styles.archivoIcon}
                      />
                    </View>
                    <View style={styles.archivoInfo}>
                      <Text
                        variant="bodyLarge"
                        style={styles.archivoNombre}
                        numberOfLines={2}
                      >
                        {archivo.titulo}
                      </Text>
                      <View style={styles.archivoMeta}>
                        <Chip
                          compact
                          style={[
                            styles.tipoChip,
                            { backgroundColor: obtenerColorPorTipo(archivo.tipoNombre || "") + "20" },
                          ]}
                          textStyle={{ color: obtenerColorPorTipo(archivo.tipoNombre || "") }}
                        >
                          {archivo.tipoNombre}
                        </Chip>
                        <Text variant="bodySmall" style={styles.archivoTamano}>
                          {formatearTamano(archivo.tamanoBytes)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </View>
            ))}
          </Card>
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