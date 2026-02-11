import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { escucharUltimasPublicaciones } from "@/scripts/services/Publications";
import { Publicacion } from "@/scripts/types/Publication.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Appbar, Avatar, Card, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Materia {
  id: string;
  nombre: string;
  semestre: number;
}

type PublicacionConMateria = Publicacion & {
  materiaNombre: string;
  materiaSemestre: number;
  totalArchivos: number;
};

type StackParamList = {
  UltimasPublicacionesMain: undefined;
  PublicationDetail: { publicacionId: string; materiaNombre: string };
  FileGallery: any;
};

// Skeleton loader
function CardSkeleton() {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [anim]);

  return (
    <Animated.View
      style={{ opacity: anim, marginHorizontal: 16, marginBottom: 12 }}
    >
      <Card style={{ borderRadius: 16, overflow: "hidden" }}>
        <Card.Content style={{ paddingVertical: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.surfaceVariant,
              }}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <View
                style={{
                  width: "60%",
                  height: 13,
                  borderRadius: 6,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              />
              <View
                style={{
                  width: "35%",
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
              />
            </View>
          </View>
          <View
            style={{
              width: "40%",
              height: 24,
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          />
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

const PublicationItem = React.memo(function PublicationItem({
  pub,
  onPress,
  theme,
}: {
  pub: PublicacionConMateria;
  onPress: (pub: PublicacionConMateria) => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={() => onPress(pub)}
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
          {/* Top row: avatar + info */}
          <View style={styles.topRow}>
            <View style={{ position: "relative" }}>
              {pub.autorFoto ? (
                <Avatar.Image size={40} source={{ uri: pub.autorFoto }} />
              ) : (
                <Avatar.Text
                  size={40}
                  label={pub.autorNombre?.charAt(0).toUpperCase() || "?"}
                />
              )}
              <AdminBadge
                size={40}
                role={pub.autorRol}
                backgroundColor={theme.colors.elevation.level1}
              />
            </View>

            <View style={styles.infoBlock}>
              <Text
                variant="titleSmall"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: theme.colors.onSurface, fontWeight: "700" }}
              >
                {pub.titulo}
              </Text>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {pub.autorNombre}
              </Text>
            </View>

          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* Bottom: subject tag */}
          <View
            style={[
              styles.subjectTag,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="book-outline"
              size={14}
              color={theme.colors.onSecondaryContainer}
            />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.onSecondaryContainer,
                flexShrink: 1,
              }}
            >
              {pub.materiaNombre}
            </Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statsLeft}>
              {pub.totalArchivos > 0 && (
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
                    {pub.totalArchivos}
                  </Text>
                </View>
              )}
              {pub.vistas > 0 && (
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
                    {pub.vistas}
                  </Text>
                </View>
              )}
              {pub.totalCalificaciones > 0 && (
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
                    {pub.totalCalificaciones}
                  </Text>
                </View>
              )}
              {pub.totalComentarios > 0 && (
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
                    {pub.totalComentarios}
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
              {pub.fechaPublicacion
                ? pub.fechaPublicacion.toLocaleDateString("es-BO", {
                    day: "numeric",
                    month: "short",
                  })
                : ""}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
});

export default function UltimasPublicacionesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>();
  const [publicaciones, setPublicaciones] = useState<PublicacionConMateria[]>(
    [],
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (pub: PublicacionConMateria) => {
      navigation.navigate("PublicationDetail", {
        publicacionId: pub.id,
        materiaNombre: pub.materiaNombre,
      });
    },
    [navigation],
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const cargar = async () => {
      try {
        setCargando(true);
        setError(false);
        // Obtener materias
        const snap = await getDocs(collection(db, "materias"));
        const mats = snap.docs.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            nombre: data.nombre,
            semestre: data.semestre,
          } as Materia;
        });

        if (!isMounted) return;

        // Escuchar últimas 30 publicaciones
        unsubscribe = escucharUltimasPublicaciones(
          30,
          async (pubs) => {
            if (!isMounted) return;

            // Obtener conteo de archivos para cada publicación
            const archivosCountMap: Record<string, number> = {};
            try {
              const archivosSnap = await getDocs(
                query(collection(db, "archivos"), where("activo", "==", true)),
              );
              archivosSnap.docs.forEach((d) => {
                const pubId = d.data().publicacionId;
                if (pubId) {
                  archivosCountMap[pubId] = (archivosCountMap[pubId] || 0) + 1;
                }
              });
            } catch (e) {
              console.warn("Error obteniendo conteo de archivos:", e);
            }

            const conMateria = pubs.map((pub) => {
              const materia = mats.find((m) => m.id === pub.materiaId);
              return {
                ...pub,
                materiaNombre: materia?.nombre || "Materia",
                materiaSemestre: materia?.semestre || 0,
                totalArchivos: archivosCountMap[pub.id] || 0,
              };
            }) as PublicacionConMateria[];

            if (!isMounted) return;
            setPublicaciones(conMateria);
            setCargando(false);
            setError(false);
          },
          (err) => {
            if (!isMounted) return;
            console.error("Error listener publicaciones:", err);
            setCargando(false);
            setError(true);
          },
        );
      } catch (err) {
        console.error("Error cargando materias/publicaciones:", err);
        if (isMounted) {
          setCargando(false);
          setError(true);
        }
      }
    };

    cargar();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Últimas publicaciones" />
      </Appbar.Header>

      {cargando ? (
        <View style={{ flex: 1, paddingTop: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
            style={{ opacity: 0.5 }}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
          >
            Error al cargar publicaciones
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 4,
              opacity: 0.7,
            }}
          >
            Revisa la consola para más detalles
          </Text>
        </View>
      ) : publicaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={64}
            color={theme.colors.onSurfaceVariant}
            style={{ opacity: 0.4 }}
          />
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
          >
            No hay publicaciones aún
          </Text>
        </View>
      ) : (
        <FlatList
          data={publicaciones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 16,
          }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <PublicationItem pub={item} onPress={handlePress} theme={theme} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardContent: {
    paddingVertical: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  subjectTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    flex: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
