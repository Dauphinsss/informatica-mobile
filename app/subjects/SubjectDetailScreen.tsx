// app/subjects/SubjectDetailScreen.tsx
import { PublicationFilters, SortBy, SortOrder } from "@/app/components/filters/PublicationFilters";
import { useTheme } from "@/contexts/ThemeContext";
import { escucharPublicacionesPorMateria } from "@/scripts/services/Publications";
import {
  ArchivoPublicacion,
  Publicacion,
} from "@/scripts/types/Publication.type";
import {
  NavigationProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Appbar,
  Avatar,
  Card,
  Chip,
  FAB,
  Text
} from "react-native-paper";
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
  const [sortBy, setSortBy] = useState<SortBy>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleFilterChange = useCallback((newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!materiaId) return;
      setCargando(true);
      const unsubscribe = escucharPublicacionesPorMateria(
        materiaId,
        (items) => {
          setPublicaciones(items);
          setCargando(false);
        }
      );
      return () => unsubscribe();
    }, [materiaId])
  );

  // 🔧 FUNCIÓN PARA APLICAR FILTROS
  const aplicarFiltros = (publicaciones: Publicacion[]): Publicacion[] => {
    let filtered = [...publicaciones];

    switch (sortBy) {
      case 'fecha':
        filtered = filtered.sort((a, b) => sortOrder === 'desc'
          ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
          : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime()
        );
        break;
      
      case 'vistas':
        filtered = filtered.sort((a, b) => sortOrder === 'desc'
          ? (b.vistas || 0) - (a.vistas || 0)
          : (a.vistas || 0) - (b.vistas || 0)
        );
        break;
      
      case 'likes':
        filtered = filtered.sort((a, b) => sortOrder === 'desc'
          ? (b.totalCalificaciones || 0) - (a.totalCalificaciones || 0)
          : (a.totalCalificaciones || 0) - (b.totalCalificaciones || 0)
        );
        break;
      
      case 'comentarios':
        filtered = filtered.sort((a, b) => sortOrder === 'desc'
          ? (b.totalComentarios || 0) - (a.totalComentarios || 0)
          : (a.totalComentarios || 0) - (b.totalComentarios || 0)
        );
        break;
      case 'semestre':
      filtered = filtered.sort((a, b) => sortOrder === 'desc'
        ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
        : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime()
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

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <PublicationFilters
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={handleFilterChange}
          theme={theme}
          showSemestreFilter={false}
        />
        {cargando ? (
          <>
          <PublicationCardSkeleton />
          <PublicationCardSkeleton />
          <PublicationCardSkeleton />
          <PublicationCardSkeleton />
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
            <Card
              key={publicacion.id}
              style={styles.card}
              onPress={() => abrirDetallePublicacion(publicacion)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
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
                    <View>
                      <Text variant="bodyMedium" style={styles.autorNombre}>
                        {publicacion.autorNombre}
                      </Text>
                      <Text variant="bodySmall" style={styles.fecha}>
                        {formatearFecha(publicacion.fechaPublicacion)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text variant="titleMedium" style={styles.titulo}>
                  {publicacion.titulo}
                </Text>

                <Text
                  variant="bodyMedium"
                  style={styles.descripcion}
                  numberOfLines={3}
                >
                  {publicacion.descripcion}
                </Text>

                <View style={styles.statsContainer}>
                  {publicacion.vistas > 0 && (
                    <Chip
                      icon="eye"
                      compact
                      style={styles.statChip}
                      textStyle={styles.statText}
                    >
                      {publicacion.vistas}
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
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={[styles.fab, { bottom: insets.bottom }]} onPress={abrirNuevaPublicacion} />
    </View>
  );
}
