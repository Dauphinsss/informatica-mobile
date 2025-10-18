import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
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
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Chip,
  FAB,
  Text,
} from "react-native-paper";
import { getStyles } from "./_SubjectDetailScreen.styles";

export default function SubjectDetailScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
  const auth = getAuth();

  const params = route.params as {
    nombre?: string;
    id?: string;
    semestre?: number;
  };

  const subjectName = params?.nombre || "Materia";
  const materiaId = params?.id || "";

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!materiaId) return;
      setCargando(true);
      const publicacionesRef = collection(db, "publicaciones");
      const q = query(
        publicacionesRef,
        where("materiaId", "==", materiaId),
        where("estado", "==", "activo")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: Publicacion[] = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            const fecha = data.fechaPublicacion?.toDate?.() ?? new Date();
            return {
              id: doc.id,
              titulo: data.titulo,
              descripcion: data.descripcion,
              autorNombre: data.autorNombre,
              fechaPublicacion: fecha,
              vistas: data.vistas ?? 0,
              totalComentarios: data.totalComentarios ?? 0,
              materiaId: data.materiaId,
            } as Publicacion;
          });
          // Ordenar en cliente por fecha más reciente
          items.sort(
            (a, b) =>
              b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
          );
          setPublicaciones(items);
          setCargando(false);
        },
        (error) => {
          console.error("Error en onSnapshot publicaciones:", error);
          setCargando(false);
        }
      );

      return () => unsubscribe();
    }, [materiaId])
  );

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
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subjectName} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {cargando ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              Cargando publicaciones...
            </Text>
          </View>
        ) : publicaciones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>
              No hay publicaciones aún
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Sé el primero en compartir contenido
            </Text>
          </View>
        ) : (
          publicaciones.map((publicacion) => (
            <Card
              key={publicacion.id}
              style={styles.card}
              onPress={() => abrirDetallePublicacion(publicacion)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {publicacion.autorNombre.charAt(0).toUpperCase()}
                      </Text>
                    </View>
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
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={abrirNuevaPublicacion} />
    </View>
  );
}
