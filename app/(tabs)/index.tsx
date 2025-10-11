import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Card,
  Checkbox,
  Divider,
  FAB,
  IconButton,
  List,
  Modal,
  Portal,
  Surface,
  Text,
} from "react-native-paper";

interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  semestre: number;
  estado: "active" | "inactive";
}

// Colores para las tarjetas estilo Classroom
const SUBJECT_COLORS = [
  { bg: "#1976d2", accent: "#0d47a1" }, // Azul
  { bg: "#388e3c", accent: "#1b5e20" }, // Verde
  { bg: "#f57c00", accent: "#ef6c00" }, // Naranja
  { bg: "#7b1fa2", accent: "#4a148c" }, // Morado
  { bg: "#d32f2f", accent: "#b71c1c" }, // Rojo
  { bg: "#303f9f", accent: "#1a237e" }, // Azul índigo
  { bg: "#0097a7", accent: "#006064" }, // Cian
  { bg: "#689f38", accent: "#33691e" }, // Verde lima
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
  const [savingSubject, setSavingSubject] = useState<string | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "usuarios", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          const materias = data.materiasInscritas || [];
          setEnrolledSubjectIds(materias);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Cargar todas las materias solo una vez al inicio
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "materias");
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subject[];

      subjectsList.sort((a, b) => {
        if (a.semestre !== b.semestre) {
          return a.semestre - b.semestre;
        }
        return a.nombre.localeCompare(b.nombre);
      });

      const activeSubjects = subjectsList.filter((s) => s.estado === "active");
      setSubjects(activeSubjects);
    } catch {
      // Error silencioso
    } finally {
      setLoadingSubjects(false);
    }
  };

  const toggleSubjectEnrollment = async (subjectId: string) => {
    if (!user) return;

    setSavingSubject(subjectId);
    const userRef = doc(db, "usuarios", user.uid);
    const isEnrolled = enrolledSubjectIds.includes(subjectId);

    try {
      if (isEnrolled) {
        await updateDoc(userRef, {
          materiasInscritas: arrayRemove(subjectId),
        });
      } else {
        await updateDoc(userRef, {
          materiasInscritas: arrayUnion(subjectId),
        });
      }
    } catch {
      if (!isEnrolled) {
        try {
          await updateDoc(userRef, {
            materiasInscritas: [subjectId],
          });
        } catch {
          Alert.alert(
            "Error",
            "No se pudo guardar la materia. Verifica tu conexión."
          );
        }
      }
    } finally {
      setSavingSubject(null);
    }
  };

  const getEnrolledSubjects = () => {
    return subjects.filter((subject) =>
      enrolledSubjectIds.includes(subject.id)
    );
  };

  const getSubjectColor = (index: number) => {
    return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    fetchSubjects();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  if (!user) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Ing. Informática" />
        <Appbar.Action
          icon="plus"
          onPress={() =>
            Alert.alert("Próximamente", "Función para inscribirse a materias")
          }
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header con saludo y estadísticas */}
        <Surface style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall">
              ¡Hola,{" "}
              {user.displayName?.split(" ")[0] || userData?.nombre || "Usuario"}
              !
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {enrolledSubjectIds.length}
                </Text>
                <Text variant="bodySmall">Materias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  0
                </Text>
                <Text variant="bodySmall">Materiales</Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Materias inscritas - Estilo Classroom */}
        {getEnrolledSubjects().length > 0 ? (
          <View >
            {getEnrolledSubjects().map((subject, index) => {
              const colorScheme = getSubjectColor(index);
              return (
                <TouchableOpacity
                  key={subject.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("SubjectDetail", {
                      nombre: subject.nombre,
                      id: subject.id,
                      semestre: subject.semestre,
                    })
                  }
                >
                  <Card style={styles.classroomCard} elevation={2}>
                    {/* Header con color - usando Card.Cover estilizado */}
                    <View
                      style={[
                        styles.cardHeader,
                        { backgroundColor: colorScheme.bg },
                      ]}
                    >
                      <Text variant="titleLarge" style={styles.cardTitle}>
                        {subject.nombre}
                      </Text>
                      {/* Patrón decorativo */}
                      <View
                        style={[
                          styles.decorativePattern,
                          { backgroundColor: colorScheme.accent },
                        ]}
                      />
                    </View>
                    {/* Footer con semestre - usando Card.Content */}
                    <Card.Content style={styles.cardFooter}>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Semestre {subject.semestre}
                      </Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
            <Surface style={styles.emptyCard} elevation={1}>
            <View style={{ alignItems: "center" }}>
              <IconButton
              icon="book-open-outline"
              size={64}
              iconColor={theme.colors.primary}
              style={{ opacity: 0.6 }}
              />
              <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurface,
                textAlign: "center",
                marginBottom: 8,
                fontWeight: "600",
              }}
              >
              No tienes materias inscritas
              </Text>
              <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
              >
              Presiona el botón Materias para seleccionar
              </Text>
            </View>
            </Surface>
        )}
      </ScrollView>

      {/* Botón Flotante para ver todas las materias */}
      <FAB
        icon="tune"
        style={styles.fab}
        onPress={handleOpenModal}
        label="Materias"
      />

      {/* Modal de todas las materias */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface }}
            >
              Todas las Materias
            </Text>
            <IconButton icon="close" size={24} onPress={handleCloseModal} />
          </View>
          <Divider />

          <ScrollView style={styles.modalContent}>
            {loadingSubjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>
                  Cargando materias...
                </Text>
              </View>
            ) : subjects.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, textAlign: "center" }}
                >
                  No hay materias disponibles
                </Text>
              </View>
            ) : (
              <List.Section>
                {subjects.map((subject, index) => {
                  const isEnrolled = enrolledSubjectIds.includes(subject.id);
                  const isSaving = savingSubject === subject.id;
                  return (
                    <React.Fragment key={subject.id}>
                      {index > 0 && <Divider />}
                      <List.Item
                        title={subject.nombre}
                        titleStyle={{ color: theme.colors.onSurface }}
                        onPress={() =>
                          !isSaving && toggleSubjectEnrollment(subject.id)
                        }
                        disabled={isSaving}
                        right={() =>
                          isSaving ? (
                            <ActivityIndicator
                              size="small"
                              style={{ marginRight: 12 }}
                            />
                          ) : (
                            <Checkbox
                              status={isEnrolled ? "checked" : "unchecked"}
                              onPress={() =>
                                toggleSubjectEnrollment(subject.id)
                              }
                            />
                          )
                        }
                      />
                    </React.Fragment>
                  );
                })}
              </List.Section>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },

  classroomCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardHeader: {
    height: 100,
    padding: 16,
    justifyContent: "flex-end",
    position: "relative",
  },
  cardTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    zIndex: 2,
  },
  decorativePattern: {
    position: "absolute",
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  cardFooter: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
    fontWeight: "bold",
  },
  subjectsCard: {
    borderRadius: 12,
    marginBottom: 16,
  },
  listSection: {
    marginTop: 0,
    paddingTop: 0,
  },
  greeting: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2c3e50",
  },
  subtitle: {
    color: "#666",
    marginBottom: 16,
  },
  statsContainer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontWeight: "bold",

    marginBottom: 4,
  },
  statLabel: {
    color: "#666",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingRight: 8,
  },
  modalContent: {
    maxHeight: 500,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 32,
  },
});
