import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Chip, Modal, Portal, Searchbar, Text, TextInput } from "react-native-paper";

type Teacher = {
  id: string;
  nombres: string;
  apellidos: string;
};

type FilterField = "todos" | "nombres" | "apellidos";
type SortOrder = "az" | "za";

export default function ManageTeachersScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState<FilterField>("todos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("az");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");

  React.useEffect(() => {
    const q = query(collection(db, "docentes"), orderBy("nombres", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            nombres: data.nombres || "",
            apellidos: data.apellidos || "",
          } as Teacher;
        });
        setTeachers(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = teachers.filter((t) => {
      if (!s) return true;
      if (filterField === "nombres") return t.nombres.toLowerCase().includes(s);
      if (filterField === "apellidos") return t.apellidos.toLowerCase().includes(s);
      return `${t.nombres} ${t.apellidos}`.toLowerCase().includes(s);
    });
    list = [...list].sort((a, b) => {
      const an = `${a.apellidos} ${a.nombres}`.trim().toLowerCase();
      const bn = `${b.apellidos} ${b.nombres}`.trim().toLowerCase();
      return sortOrder === "az" ? an.localeCompare(bn) : bn.localeCompare(an);
    });
    return list;
  }, [teachers, search, filterField, sortOrder]);

  const createTeacher = async () => {
    const nom = nombres.trim();
    const ape = apellidos.trim();
    if (!nom || !ape) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "docentes"), {
        nombres: nom,
        apellidos: ape,
        createdAt: serverTimestamp(),
      });
      setDialogVisible(false);
      setNombres("");
      setApellidos("");
    } catch (error) {
      console.error("Error creando docente:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Docentes" />
        <Appbar.Action icon="plus" onPress={() => setDialogVisible(true)} />
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Buscar docente..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />

        <View style={styles.chipsRow}>
          <Chip selected={filterField === "todos"} onPress={() => setFilterField("todos")}>
            Todos
          </Chip>
          <Chip selected={filterField === "nombres"} onPress={() => setFilterField("nombres")}>
            Nombres
          </Chip>
          <Chip selected={filterField === "apellidos"} onPress={() => setFilterField("apellidos")}>
            Apellidos
          </Chip>
        </View>
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
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando docentes...</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay docentes.</Text>
          ) : (
            filtered.map((t) => (
              <Card key={t.id} style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium">{`${t.apellidos}, ${t.nombres}`}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "position"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 80}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Nuevo docente
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                label="Nombres"
                mode="outlined"
                value={nombres}
                onChangeText={setNombres}
                style={{ marginBottom: 10 }}
              />
              <TextInput
                label="Apellidos"
                mode="outlined"
                value={apellidos}
                onChangeText={setApellidos}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Button onPress={() => setDialogVisible(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                onPress={createTeacher}
                mode="contained"
                loading={saving}
                disabled={saving}
              >
                Guardar
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  modalContainer: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontWeight: "700",
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
});
