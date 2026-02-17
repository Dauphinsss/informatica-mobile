import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Avatar, Card, Text } from "react-native-paper";

type PendingPublication = {
  id: string;
  autorUid: string;
  autorNombre: string;
  autorFoto?: string | null;
  autorRol?: string;
  materiaId: string;
  titulo: string;
  descripcion?: string;
  fechaPublicacion?: Date;
};

export default function PendingPublicationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [pendingPublications, setPendingPublications] = useState<PendingPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectNameCache, setSubjectNameCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, "publicaciones"), where("estado", "==", "pendiente"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            id: docSnap.id,
            autorUid: data.autorUid || "",
            autorNombre: data.autorNombre || "Usuario",
            autorFoto: data.autorFoto || null,
            autorRol: data.autorRol || "",
            materiaId: data.materiaId || "",
            titulo: data.titulo || "Sin título",
            descripcion: data.descripcion || "",
            fechaPublicacion: data.fechaPublicacion?.toDate
              ? data.fechaPublicacion.toDate()
              : undefined,
          } as PendingPublication;
        });

        list.sort((a, b) => {
          const aTs = a.fechaPublicacion?.getTime?.() || 0;
          const bTs = b.fechaPublicacion?.getTime?.() || 0;
          return bTs - aTs;
        });

        setPendingPublications(list);
        setLoading(false);

        const missingSubjectIds = Array.from(
          new Set(list.map((item) => item.materiaId).filter(Boolean)),
        );
        if (missingSubjectIds.length > 0) {
          const resolved: Record<string, string> = {};
          await Promise.all(
            missingSubjectIds.map(async (id) => {
              try {
                const subjectSnap = await getDoc(doc(db, "materias", id));
                resolved[id] = subjectSnap.exists()
                  ? subjectSnap.data()?.nombre || "Materia"
                  : "Materia";
              } catch {
                resolved[id] = "Materia";
              }
            }),
          );
          setSubjectNameCache((prev) => ({ ...prev, ...resolved }));
        }
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, []);

  const pendingCount = useMemo(
    () => pendingPublications.length,
    [pendingPublications.length],
  );

  const openPublicationPreview = (publication: PendingPublication) => {
    navigation.navigate(
      "PublicationDetail" as never,
      {
        publicacionId: publication.id,
        materiaNombre: subjectNameCache[publication.materiaId] || "Materia",
        adminReviewMode: true,
      } as never,
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Publicaciones pendientes" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          Pendientes: {pendingCount}
        </Text>

        {loading ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Cargando publicaciones...
          </Text>
        ) : pendingPublications.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            No hay publicaciones pendientes.
          </Text>
        ) : (
          pendingPublications.map((publication) => (
            <Card
              key={publication.id}
              style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}
              onPress={() => openPublicationPreview(publication)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.topRow}>
                  <View style={{ position: "relative" }}>
                    {publication.autorFoto ? (
                      <Avatar.Image size={40} source={{ uri: publication.autorFoto }} />
                    ) : (
                      <Avatar.Text
                        size={40}
                        label={publication.autorNombre?.charAt(0).toUpperCase() || "?"}
                      />
                    )}
                    <AdminBadge
                      size={40}
                      role={publication.autorRol}
                      backgroundColor={theme.colors.elevation.level1}
                    />
                  </View>

                  <View style={styles.infoBlock}>
                    <Text variant="titleSmall" numberOfLines={2} style={styles.pubTitle}>
                      {publication.titulo}
                    </Text>
                    <Text variant="bodySmall" numberOfLines={1} style={styles.authorText}>
                      {publication.autorNombre}
                    </Text>
                  </View>
                </View>

                {!!publication.descripcion?.trim() && (
                  <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
                    {publication.descripcion}
                  </Text>
                )}

                <View style={styles.metaRow}>
                  <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                    {subjectNameCache[publication.materiaId] || "Materia"}
                  </Text>
                  <Text variant="labelSmall" style={styles.dateText}>
                    {publication.fechaPublicacion
                      ? publication.fechaPublicacion.toLocaleDateString("es-BO", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    borderRadius: 12,
  },
  cardContent: {
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoBlock: {
    flex: 1,
    minWidth: 0,
  },
  pubTitle: {
    fontWeight: "700",
  },
  authorText: {
    opacity: 0.85,
  },
  description: {
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dateText: {
    opacity: 0.8,
  },
});

