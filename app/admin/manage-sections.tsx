import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Chip, Dialog, Portal, Searchbar, Text, TextInput } from "react-native-paper";

type Section = {
  id: string;
  nombre: string;
};

type SortOrder = "az" | "za";

export default function ManageSectionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState("");

  React.useEffect(() => {
    const q = query(collection(db, "secciones"), orderBy("nombre", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, nombre: data.nombre || "" } as Section;
        });
        setSections(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = sections.filter((sec) => !s || sec.nombre.toLowerCase().includes(s));
    list = [...list].sort((a, b) =>
      sortOrder === "az"
        ? a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase())
        : b.nombre.toLowerCase().localeCompare(a.nombre.toLowerCase()),
    );
    return list;
  }, [sections, search, sortOrder]);

  const createSection = async () => {
    const name = nombre.trim();
    if (!name) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "secciones"), {
        nombre: name,
        createdAt: serverTimestamp(),
      });
      setDialogVisible(false);
      setNombre("");
    } catch (error) {
      console.error("Error creando sección:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Secciones" />
        <Appbar.Action icon="plus" onPress={() => setDialogVisible(true)} />
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Buscar sección..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <View style={styles.chipsRow}>
          <Chip selected={sortOrder === "az"} onPress={() => setSortOrder("az")}>
            A-Z
          </Chip>
          <Chip selected={sortOrder === "za"} onPress={() => setSortOrder("za")}>
            Z-A
          </Chip>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando secciones...</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay secciones.</Text>
          ) : (
            filtered.map((s) => (
              <Card key={s.id} style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium">{s.nombre}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Nueva sección</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Nombre de la sección" mode="outlined" value={nombre} onChangeText={setNombre} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onPress={createSection} mode="contained" loading={saving} disabled={saving}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  search: { marginBottom: 10 },
  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
});

