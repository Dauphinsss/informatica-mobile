// (reemplaza tu ManageSubjectsScreen actual con este contenido)
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"; // <-- funciones storage
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  FAB,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { auth, db, storage } from "../../firebase"; // <-- agregué storage

// Components
import CreateSubjectModal from "./components/CreateSubjectModal";
import EditSubjectModal from "./components/EditSubjectModal";
import SubjectCard from "./components/SubjectCard";

// Utils and Types
import { AdminStackParamList, SemestreOption, Subject } from "./_types";
import {
  normalizeText,
  validateSubjectFields,
} from "./_utils/subjectValidations";

type ManageSubjectsScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "ManageSubjects"
>;

export default function ManageSubjectsScreen() {
  const navigation = useNavigation<ManageSubjectsScreenNavigationProp>();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [updatingSubjectId, setUpdatingSubjectId] = useState<string | null>(
    null
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );

  // Estado del formulario de CREACIÓN
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    semestre: "" as string,
    imagenUrl: undefined as string | undefined,
  });
  const [errors, setErrors] = useState({
    nombre: "",
    descripcion: "",
    semestre: "",
  });

  // Estado del formulario de EDICIÓN
  const [editFormData, setEditFormData] = useState({
    nombre: "",
    descripcion: "",
    semestre: 1 as SemestreOption,
    imagenUrl: undefined as string | undefined,
  });
  const [editErrors, setEditErrors] = useState({
    nombre: "",
    descripcion: "",
    semestre: "",
  });

  // Util: subir imagen local a storage y devolver downloadURL
  const uploadLocalImageAndGetUrl = async (localUri: string) => {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `materias/${timestamp}-${randomStr}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err) {
      console.error("Error subiendo imagen (parent):", err);
      throw err;
    }
  };

  // Función para obtener materias de Firebase
  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "materias");
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
        createdAt: (doc.data() as any).createdAt?.toDate
          ? (doc.data() as any).createdAt.toDate()
          : (doc.data() as any).createdAt || new Date(),
      })) as Subject[];

      // Ordenar por semestre (numérico) y luego por nombre
      subjectsList.sort((a, b) => {
        const sa = Number(a.semestre ?? 0);
        const sb = Number(b.semestre ?? 0);
        if (!Number.isNaN(sa) && !Number.isNaN(sb) && sa !== sb) return sa - sb;
        return (a.nombre || "").localeCompare(b.nombre || "");
      });

      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showSnackbar("Error al cargar las materias", "error");
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  // Verificar duplicados (excluir id opcional)
  const checkDuplicateSubject = async (
    nombre: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const subjectsCollection = collection(db, "materias");
      const querySnapshot = await getDocs(subjectsCollection);

      const normalizedNewNombre = normalizeText(nombre);

      const exists = querySnapshot.docs.some((doc) => {
        if (excludeId && doc.id === excludeId) return false;
        const subjectData = doc.data();
        const existingNombre = subjectData.nombre || "";
        return normalizeText(existingNombre) === normalizedNewNombre;
      });

      return exists;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  };

  // Crear nueva materia
  // ahora acepta optional finalData (para cuando el modal le pase el objeto final)
  const handleCreateSubject = async (finalData?: any) => {
    const data = finalData ?? formData;

    const { isValid, errors: validationErrors } = validateSubjectFields(data);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const nombreNormalizado = (data.nombre || "").trim();

      const exists = await checkDuplicateSubject(nombreNormalizado);
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          nombre: "Ya existe una materia con ese nombre",
        }));
        setLoading(false);
        return;
      }

      // Si tiene imagen local (no empieza por http), subir aquí y reemplazar
      let imagenUrlToSave = data.imagenUrl;
      if (imagenUrlToSave && !imagenUrlToSave.startsWith("http")) {
        try {
          imagenUrlToSave = await uploadLocalImageAndGetUrl(imagenUrlToSave);
        } catch (err) {
          console.error("Error subiendo imagen antes de crear subject:", err);
          // opcional: mostrar alerta, pero seguimos intentando guardar sin imagen
          imagenUrlToSave = undefined;
        }
      }

      const semestreNum =
        typeof data.semestre === "string"
          ? parseInt(data.semestre) || 0
          : Number(data.semestre || 0);

      const newSubject = {
        nombre: nombreNormalizado,
        descripcion: (data.descripcion || "").trim(),
        semestre: semestreNum,
        estado: "active",
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid,
        imagenUrl: imagenUrlToSave,
      };

      const docRef = await addDoc(collection(db, "materias"), newSubject);

      // Notificación (opcional)
      try {
        const { notificarCreacionMateria } = await import(
          "@/services/notifications"
        );
        await notificarCreacionMateria(
          docRef.id,
          nombreNormalizado,
          (data.descripcion || "").trim()
        );
      } catch (error) {
        console.error("❌ Error al enviar notificación:", error);
      }

      showSnackbar("Materia creada satisfactoriamente", "success");

      setFormData({
        nombre: "",
        descripcion: "",
        semestre: "",
        imagenUrl: undefined,
      });
      setModalVisible(false);
      setErrors({ nombre: "", descripcion: "", semestre: "" });

      fetchSubjects();
    } catch (error) {
      console.error("Error creating subject:", error);
      showSnackbar("No se pudo crear la materia, intente nuevamente", "error");
    } finally {
      setLoading(false);
    }
  };

  // Editar materia (subir imagen local si existe)
  const handleEditSubject = async () => {
    if (!editingSubject) return;

    const { isValid, errors: validationErrors } =
      validateEditFields(editFormData);
    if (!isValid) {
      setEditErrors(validationErrors);
      return;
    }

    setUpdateLoading(true);

    try {
      const nombreNormalizado = editFormData.nombre.trim();

      const exists = await checkDuplicateSubject(
        nombreNormalizado,
        editingSubject.id
      );
      if (exists) {
        setEditErrors((prev) => ({
          ...prev,
          nombre: "Ya existe una materia con ese nombre",
        }));
        setUpdateLoading(false);
        return;
      }

      // Si imagen local, subirla
      let imagenUrlToSave = editFormData.imagenUrl;
      if (imagenUrlToSave && !imagenUrlToSave.startsWith("http")) {
        try {
          imagenUrlToSave = await uploadLocalImageAndGetUrl(imagenUrlToSave);
        } catch (err) {
          console.error("Error subiendo imagen en editar:", err);
          imagenUrlToSave = undefined;
        }
      }

      const subjectRef = doc(db, "materias", editingSubject.id);
      await updateDoc(subjectRef, {
        nombre: nombreNormalizado,
        descripcion: editFormData.descripcion.trim(),
        semestre: editFormData.semestre,
        imagenUrl: imagenUrlToSave,
        updatedAt: new Date(),
      });

      showSnackbar("Materia actualizada satisfactoriamente", "success");
      setEditModalVisible(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error updating subject:", error);
      showSnackbar(
        "No se pudo actualizar la materia, intente nuevamente",
        "error"
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = (subject: Subject) => {
    navigation.navigate("EditSubject", { subject });
  };

  // Validación edición
  const validateEditFields = (formData: {
    nombre: string;
    descripcion: string;
    semestre: SemestreOption;
  }) => {
    const errors = {
      nombre: "",
      descripcion: "",
      semestre: "",
    };

    const nombreRegex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ,.;:()\-]+$/;
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.length > 30) {
      errors.nombre = "El nombre no puede tener más de 30 caracteres";
    } else if (!nombreRegex.test(formData.nombre)) {
      errors.nombre = "El nombre contiene caracteres no válidos";
    }

    if (!formData.descripcion.trim()) {
      errors.descripcion = "La descripción es obligatoria";
    }

    const isValid = !Object.values(errors).some((error) => error !== "");
    return { isValid, errors };
  };

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const toggleSubjectStatus = async (
    subjectId: string,
    currentStatus: "active" | "inactive"
  ) => {
    setUpdatingSubjectId(subjectId);

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const subjectRef = doc(db, "materias", subjectId);
      await updateDoc(subjectRef, { estado: newStatus });

      setSubjects((prevSubjects) =>
        prevSubjects.map((subject) =>
          subject.id === subjectId ? { ...subject, estado: newStatus } : subject
        )
      );

      showSnackbar(
        `Materia ${newStatus === "active" ? "activada" : "desactivada"}`,
        "success"
      );
    } catch (error) {
      console.error("Error updating subject status:", error);
      showSnackbar("Error al cambiar el estado", "error");
    } finally {
      setUpdatingSubjectId(null);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const nombre = subject.nombre || "";
    const descripcion = subject.descripcion || "";
    const semestre = subject.semestre?.toString() || "";

    return (
      nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      semestre.includes(searchQuery)
    );
  });

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const isSaveDisabled =
    !formData.nombre.trim() ||
    !formData.descripcion.trim() ||
    !formData.semestre ||
    loading;

  const isEditSaveDisabled =
    !editFormData.nombre.trim() ||
    !editFormData.descripcion.trim() ||
    updateLoading;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Materias" />
        <Appbar.Action
          icon="magnify"
          onPress={() => setSearchOpen(!searchOpen)}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {searchOpen && (
          <Searchbar
            placeholder="Buscar materia..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            autoFocus
          />
        )}

        {loadingSubjects ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Cargando materias...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
          >
            {filteredSubjects.map((subject, index) => (
              <View key={subject.id}>
                <SubjectCard
                  subject={subject}
                  index={index}
                  onToggleStatus={toggleSubjectStatus}
                  onEdit={handleOpenEditModal}
                  isUpdating={updatingSubjectId === subject.id}
                />
              </View>
            ))}

            {filteredSubjects.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📚</Text>
                <Text variant="titleMedium" style={styles.emptyStateTitle}>
                  No se encontraron materias
                </Text>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  {searchQuery
                    ? "Intenta con otros términos de búsqueda"
                    : "Presiona el botón + para crear la primera materia"}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <Portal>
        <CreateSubjectModal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setErrors({ nombre: "", descripcion: "", semestre: "" });
          }}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          loading={loading}
          onSave={handleCreateSubject} // ahora acepta optional finalData
          isSaveDisabled={isSaveDisabled}
        />
      </Portal>

      <Portal>
        <EditSubjectModal
          visible={editModalVisible}
          onDismiss={() => {
            setEditModalVisible(false);
            setEditingSubject(null);
            setEditErrors({ nombre: "", descripcion: "", semestre: "" });
          }}
          subject={editingSubject}
          formData={editFormData}
          setFormData={(data) =>
            setEditFormData({ ...data, imagenUrl: data.imagenUrl })
          }
          errors={editErrors}
          loading={updateLoading}
          onSave={handleEditSubject}
          isSaveDisabled={isEditSaveDisabled}
        />
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("CreateSubject")}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          {
            backgroundColor:
              snackbarType === "success"
                ? theme.colors.primary
                : theme.colors.error,
          },
        ]}
        action={{
          label: "OK",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  searchbar: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    textAlign: "center",
    lineHeight: 20,
  },
  snackbar: {
    marginBottom: 80,
  },
} as const;
