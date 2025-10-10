import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
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
import { auth, db } from "../../firebase";

// Components
import CreateSubjectModal from "./components/CreateSubjectModal";
import SubjectCard from "./components/SubjectCard";

// Utils and Types
import { AdminStackParamList, Subject } from "./types";
import {
  normalizeText,
  validateSubjectFields,
} from "./utils/subjectValidations";

type ManageSubjectsScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "ManageSubjects"
>;

export default function ManageSubjectsScreen() {
  const navigation = useNavigation<ManageSubjectsScreenNavigationProp>();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [updatingSubjectId, setUpdatingSubjectId] = useState<string | null>(
    null
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    semestre: "",
  });
  const [errors, setErrors] = useState({
    nombre: "",
    descripcion: "",
    semestre: "",
  });

  // Función para obtener materias de Firebase
  const fetchSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "materias");
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Subject[];

      // ✅ ORDENAR POR SEMESTRE (ascendente) y luego por nombre
      subjectsList.sort((a, b) => {
        // Primero por semestre (de menor a mayor)
        if (a.semestre !== b.semestre) {
          return a.semestre - b.semestre;
        }
        // Si tienen el mismo semestre, ordenar alfabéticamente por nombre
        return a.nombre.localeCompare(b.nombre);
      });

      setSubjects(subjectsList);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showSnackbar("Error al cargar las materias", "error");
    } finally {
      setLoadingSubjects(false);
    }
  }, []);

  // Verificar si existe materia con mismo nombre (sin importar semestre)
  const checkDuplicateSubject = async (nombre: string): Promise<boolean> => {
    try {
      const subjectsCollection = collection(db, "materias");
      const querySnapshot = await getDocs(subjectsCollection);

      const normalizedNewNombre = normalizeText(nombre);

      const exists = querySnapshot.docs.some((doc) => {
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

  // Función para crear nueva materia
  const handleCreateSubject = async () => {
    const { isValid, errors: validationErrors } =
      validateSubjectFields(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const semestre = parseInt(formData.semestre);
      const nombreNormalizado = formData.nombre.trim();

      const exists = await checkDuplicateSubject(nombreNormalizado);
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          nombre: "Ya existe una materia con ese nombre",
        }));
        setLoading(false);
        return;
      }

      const newSubject = {
        nombre: nombreNormalizado,
        descripcion: formData.descripcion.trim(),
        semestre: semestre,
        estado: "active",
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid,
      };

      await addDoc(collection(db, "materias"), newSubject);

      showSnackbar("Materia creada satisfactoriamente", "success");

      setFormData({ nombre: "", descripcion: "", semestre: "" });
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

  // Función para mostrar snackbar
  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Función optimizada para cambiar estado de la materia
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

  // Filtrar materias según búsqueda
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

  // Cargar materias al montar el componente
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Verificar si el botón debe estar deshabilitado
  const isSaveDisabled =
    !formData.nombre.trim() ||
    !formData.descripcion.trim() ||
    !formData.semestre ||
    loading;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Gestión de Materias" />
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Buscar materia..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {loadingSubjects ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Cargando materias...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onToggleStatus={toggleSubjectStatus}
                isUpdating={updatingSubjectId === subject.id}
              />
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

      {/* Modal para crear nueva materia */}
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
          onSave={handleCreateSubject}
          isSaveDisabled={isSaveDisabled}
        />
      </Portal>

      {/* FAB para abrir modal */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      {/* Snackbar para mensajes */}
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
    padding: 16,
  },
  scrollView: {
    flex: 1,
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
