import { SortOption, SortableChips, SortOrder } from "@/app/components/filters/SortableChips";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Modal, Portal, Text, TextInput } from "react-native-paper";

type Teacher = {
  id: string;
  nombres: string;
  apellidos: string;
};

type TeachersSortBy = "nombres" | "apellidos";

export default function ManageTeachersScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<TeachersSortBy>("apellidos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardOffset = Platform.OS === "ios" ? 110 : 150;

  const teachersSortOptions: SortOption<TeachersSortBy>[] = [
    { key: "apellidos", label: "Apellidos" },
    { key: "nombres", label: "Nombres" },
  ];

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

  React.useEffect(() => {
    const onShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const filtered = useMemo(() => {
    const list = [...teachers].sort((a, b) => {
      const aValue = sortBy === "apellidos" ? a.apellidos : a.nombres;
      const bValue = sortBy === "apellidos" ? b.apellidos : b.nombres;
      const result = aValue.trim().toLowerCase().localeCompare(bValue.trim().toLowerCase());
      return sortOrder === "asc" ? result : -result;
    });
    return list;
  }, [teachers, sortBy, sortOrder]);

  const handleFilterChange = (newSortBy: TeachersSortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const resetForm = () => {
    setEditingTeacherId(null);
    setNombres("");
    setApellidos("");
  };

  const closeDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setNombres(teacher.nombres);
    setApellidos(teacher.apellidos);
    setDialogVisible(true);
  };

  const saveTeacher = async () => {
    const nom = nombres.trim();
    const ape = apellidos.trim();
    if (!nom || !ape) return;
    setSaving(true);
    try {
      if (editingTeacherId) {
        await updateDoc(doc(db, "docentes", editingTeacherId), {
          nombres: nom,
          apellidos: ape,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "docentes"), {
          nombres: nom,
          apellidos: ape,
          createdAt: serverTimestamp(),
        });
      }
      closeDialog();
    } catch (error) {
      console.error("Error guardando docente:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTeacher = () => {
    if (!editingTeacherId) return;
    Alert.alert(
      "Eliminar docente",
      "Esta accion no se puede deshacer. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteDoc(doc(db, "docentes", editingTeacherId));
              closeDialog();
            } catch (error) {
              console.error("Error eliminando docente:", error);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Docentes" />
        <Appbar.Action icon="plus" onPress={openCreateDialog} />
      </Appbar.Header>

      <View style={styles.content}>
        <SortableChips
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={handleFilterChange}
          options={teachersSortOptions}
          theme={theme}
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando docentes...</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay docentes.</Text>
          ) : (
            filtered.map((t) => (
              <Card
                key={t.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => openEditDialog(t)}
              >
                <Card.Content>
                  <View style={styles.teacherRow}>
                    <View style={styles.teacherTextBlock}>
                      <Text variant="titleMedium">
                        {sortBy === "apellidos"
                          ? `${t.apellidos} ${t.nombres}`.trim()
                          : `${t.nombres} ${t.apellidos}`.trim()}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={dialogVisible}
          onDismiss={closeDialog}
          contentContainerStyle={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateY: keyboardHeight > 0 ? -Math.min(keyboardHeight * 0.35, 140) : 0 }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={keyboardOffset}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingTeacherId ? "Editar docente" : "Nuevo docente"}
              </Text>
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
              <View style={styles.modalActions}>
                {editingTeacherId ? (
                  <Button
                    onPress={deleteTeacher}
                    disabled={saving}
                    textColor={theme.colors.error}
                  >
                    Eliminar
                  </Button>
                ) : null}
                <Button onPress={closeDialog} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  onPress={saveTeacher}
                  mode="contained"
                  loading={saving}
                  disabled={saving}
                >
                  {editingTeacherId ? "Actualizar" : "Guardar"}
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  card: { marginBottom: 10, borderRadius: 12, borderWidth: 1 },
  teacherRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  teacherTextBlock: {
    flex: 1,
  },
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
  modalScrollContent: {
    paddingBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
});
