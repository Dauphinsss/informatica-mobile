import { SortOption, SortableChips, SortOrder } from "@/app/components/filters/SortableChips";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Modal, Portal, Text, TextInput } from "react-native-paper";

type Section = {
  id: string;
  nombre: string;
};

type SectionsSortBy = "nombre";

export default function ManageSectionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SectionsSortBy>("nombre");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nombre, setNombre] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardOffset = Platform.OS === "ios" ? 110 : 150;

  const sectionSortOptions: SortOption<SectionsSortBy>[] = [{ key: "nombre", label: "Nombre" }];

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
    const list = [...sections].sort((a, b) => {
      const aValue = sortBy === "nombre" ? a.nombre : a.nombre;
      const bValue = sortBy === "nombre" ? b.nombre : b.nombre;
      const result = aValue.trim().toLowerCase().localeCompare(bValue.trim().toLowerCase());
      return sortOrder === "asc" ? result : -result;
    });
    return list;
  }, [sections, sortOrder, sortBy]);

  const handleFilterChange = (newSortBy: SectionsSortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const resetForm = () => {
    setEditingSectionId(null);
    setNombre("");
  };

  const closeDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const openEditDialog = (section: Section) => {
    setEditingSectionId(section.id);
    setNombre(section.nombre);
    setDialogVisible(true);
  };

  const saveSection = async () => {
    const name = nombre.trim();
    if (!name) return;
    setSaving(true);
    try {
      if (editingSectionId) {
        await updateDoc(doc(db, "secciones", editingSectionId), {
          nombre: name,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "secciones"), {
          nombre: name,
          createdAt: serverTimestamp(),
        });
      }
      closeDialog();
    } catch (error) {
      console.error("Error guardando sección:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = () => {
    if (!editingSectionId) return;
    Alert.alert(
      "Eliminar sección",
      "Esta accion no se puede deshacer. ¿Quieres continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteDoc(doc(db, "secciones", editingSectionId));
              closeDialog();
            } catch (error) {
              console.error("Error eliminando sección:", error);
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
        <Appbar.Content title="Secciones" />
        <Appbar.Action icon="plus" onPress={openCreateDialog} />
      </Appbar.Header>

      <View style={styles.content}>
        <SortableChips
          sortBy={sortBy}
          sortOrder={sortOrder}
          onFilterChange={handleFilterChange}
          options={sectionSortOptions}
          theme={theme}
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando secciones...</Text>
          ) : filtered.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No hay secciones.</Text>
          ) : (
            filtered.map((s) => (
              <Card
                key={s.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.elevation.level1,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => openEditDialog(s)}
              >
                <Card.Content>
                  <View style={styles.sectionRow}>
                    <View style={styles.sectionTextBlock}>
                      <Text variant="titleMedium">{s.nombre}</Text>
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
                {editingSectionId ? "Editar sección" : "Nueva sección"}
              </Text>
              <TextInput
                label="Nombre de la sección"
                mode="outlined"
                value={nombre}
                onChangeText={setNombre}
              />
              <View style={styles.modalActions}>
                {editingSectionId ? (
                  <Button
                    onPress={deleteSection}
                    disabled={saving}
                    textColor={theme.colors.error}
                  >
                    Eliminar
                  </Button>
                ) : null}
                <Button onPress={closeDialog} disabled={saving}>
                  Cancelar
                </Button>
                <Button onPress={saveSection} mode="contained" loading={saving} disabled={saving}>
                  {editingSectionId ? "Actualizar" : "Guardar"}
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
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionTextBlock: {
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
