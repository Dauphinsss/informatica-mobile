import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Switch, Text } from "react-native-paper";
import { db } from "../../firebase";

type Announcement = {
  id: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string;
  activo: boolean;
  updatedAtMs: number;
};

export default function ManageAnnouncementsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "anuncios"),
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          const updatedAtMs =
            data?.updatedAt?.toDate?.()?.getTime?.() ??
            data?.createdAt?.toDate?.()?.getTime?.() ??
            0;
          return {
            id: d.id,
            titulo: typeof data?.titulo === "string" ? data.titulo : "",
            mensaje: typeof data?.mensaje === "string" ? data.mensaje : "",
            imagenUrl: typeof data?.imagenUrl === "string" ? data.imagenUrl : "",
            activo: Boolean(data?.activo),
            updatedAtMs,
          } as Announcement;
        });
        setAnnouncements(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return b.updatedAtMs - a.updatedAtMs;
    });
  }, [announcements]);

  const toggleAnnouncementActive = async (item: Announcement, nextValue: boolean) => {
    setUpdatingIds((prev) => ({ ...prev, [item.id]: true }));
    try {
      await updateDoc(doc(db, "anuncios", item.id), {
        activo: nextValue,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error cambiando estado del anuncio:", error);
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Anuncios" />
        <Appbar.Action icon="plus" onPress={() => navigation.navigate("CreateAnnouncement")} />
      </Appbar.Header>

      <View style={styles.content}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando anuncios...</Text>
          ) : sortedAnnouncements.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay anuncios.</Text>
          ) : (
            sortedAnnouncements.map((item) => (
              <Card
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => navigation.navigate("EditAnnouncement", { announcementId: item.id })}
              >
                <Card.Content>
                  {item.imagenUrl ? (
                    <Image source={{ uri: item.imagenUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : null}
                  <View style={styles.cardTopRow}>
                    <Text variant="titleMedium" numberOfLines={1} style={styles.cardTitle}>
                      {item.titulo}
                    </Text>
                    {item.activo ? (
                      <View style={[styles.activeBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.onPrimaryContainer, fontWeight: "700" }}
                        >
                          Activo
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.mensaje}
                  </Text>
                  <View style={styles.switchRow}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      Activo
                    </Text>
                    <Switch
                      value={item.activo}
                      onValueChange={(value) => toggleAnnouncementActive(item, value)}
                      disabled={Boolean(updatingIds[item.id])}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  cardImage: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: "700",
    flex: 1,
  },
  activeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  switchRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
