import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { useCalcularSemestre } from "@/hooks/useCalcularSemestre";
import { setModalVisible as setGlobalModalCallback } from "@/services/navigationService";
import { escucharNotificaciones, NotificacionCompleta } from "@/services/notifications";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Card,
  FAB,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";
import SubjectCardSkeleton from "./components/SubjectCardSkeleton";
import SubjectsModal from "./components/SubjectsModal";
import UserProfileModal from "./components/UserProfileModal";

interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
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
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
  const [subjectMaterials, setSubjectMaterials] = useState<
    Record<string, number>
  >({});
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [newSubjectIds, setNewSubjectIds] = useState<string[]>([]);
  const [newSubjectsNotifIds, setNewSubjectsNotifIds] = useState<Map<string, string>>(new Map());

  const formatSemestre = (sem: any) => {
    if (typeof sem === "string" && sem.trim().toLowerCase() === "electiva") {
      return "Electiva";
    }

    const n = Number(sem);
    if (Number.isNaN(n)) {
      return String(sem || "");
    }

    const labels: Record<number, string> = {
      1: "1er Semestre",
      2: "2do Semestre",
      3: "3er Semestre",
      4: "4to Semestre",
      5: "5to Semestre",
      6: "6to Semestre",
      7: "7mo Semestre",
      8: "8vo Semestre",
      9: "9no Semestre",
      10: "Electiva",
    };

    return labels[n] || `${n}º Semestre`;
  };

  const enrolledSubjects = useMemo(() => {
    if (allSubjects.length === 0 || enrolledSubjectIds.length === 0) {
      return [];
    }
    const validIds = new Set(
      enrolledSubjectIds.filter(
        (id) => typeof id === "string" && id.trim() !== ""
      )
    );
    return allSubjects.filter((subject) => validIds.has(subject.id));
  }, [allSubjects, enrolledSubjectIds]);

  const totalMaterials = useMemo(
    () =>
      enrolledSubjects.reduce(
        (acc, subject) => acc + (subjectMaterials[subject.id] ?? 0),
        0
      ),
    [enrolledSubjects, subjectMaterials]
  );
  const totalMaterialsLabel = totalMaterials === 1 ? "Material" : "Materiales";
  const user = auth.currentUser;

  useCalcularSemestre(user?.uid, enrolledSubjectIds);

  useEffect(() => {
    setGlobalModalCallback(setModalVisible);
  }, []);

  useEffect(() => {
    if (!user || !isFocused) return;
    
    const unsubscribe = escucharNotificaciones(
      user.uid,
      (notifs: NotificacionCompleta[]) => {
        const nuevasMaterias = notifs
          .filter((n) => !n.leida && n.metadata?.accion === "ver_materia")
          .map((n) => ({ id: n.metadata?.materiaId!, notifId: n.id }))
          .filter((item) => item.id);
        
        const idsMap = new Map<string, string>();
        nuevasMaterias.forEach((item) => {
          idsMap.set(item.id, item.notifId);
        });
        
        setNewSubjectIds(nuevasMaterias.map((item) => item.id));
        setNewSubjectsNotifIds(idsMap);
      }
    );
    
    return () => unsubscribe();
  }, [user, isFocused]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "usuarios", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          const materias = Array.isArray(data.materiasInscritas)
            ? data.materiasInscritas.filter(
                (id): id is string => typeof id === "string" && id.trim() !== ""
              )
            : [];
          setEnrolledSubjectIds(materias);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    const subjectsCollection = collection(db, "materias");
    
    const unsubscribe = onSnapshot(
      subjectsCollection,
      (snapshot) => {
        const subjectsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Subject[];

        const activeSubjects = subjectsList.filter((s) => s.estado === "active");
        setAllSubjects(activeSubjects);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al cargar materias:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMaterialsCount = async () => {
      if (enrolledSubjectIds.length === 0) {
        if (isMounted) {
          setSubjectMaterials({});
        }
        return;
      }

      try {
        const uniqueSubjectIds = Array.from(new Set(enrolledSubjectIds));
        const publicacionesRef = collection(db, "publicaciones");
        const materialsBySubject: Record<string, number> = {};

        await Promise.all(
          uniqueSubjectIds.map(async (subjectId) => {
            const publicacionesQuery = query(
              publicacionesRef,
              where("materiaId", "==", subjectId),
              where("estado", "==", "activo")
            );
            const snapshot = await getDocs(publicacionesQuery);
            materialsBySubject[subjectId] = snapshot.size;
          })
        );

        if (isMounted) {
          setSubjectMaterials(materialsBySubject);
        }
      } catch (error) {
        console.error("Error al obtener materiales:", error);
        if (isMounted) {
          setSubjectMaterials({});
        }
      }
    };

    fetchMaterialsCount();

    return () => {
      isMounted = false;
    };
  }, [enrolledSubjectIds]);

  const getSubjectColor = (index: number) => {
    return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  };

  const handleOpenModal = () => {
    setModalVisible(true);
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
        <TouchableOpacity
          onPress={() => setUserMenuVisible(true)}
          style={styles.avatarButton}
        >
          {user.photoURL ? (
            <Avatar.Image size={32} source={{ uri: user.photoURL }} />
          ) : (
            <Avatar.Text
              size={32}
              label={user.displayName?.charAt(0).toUpperCase() || "?"}
            />
          )}
        </TouchableOpacity>
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
                  {enrolledSubjects.length}
                </Text>
                <Text variant="bodySmall">Materias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {totalMaterials}
                </Text>
                <Text variant="bodySmall">{totalMaterialsLabel}</Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Materias inscritas - Estilo Classroom */}
        {isLoading ? (
          <View>
            {[1, 2, 3].map((index) => (
              <SubjectCardSkeleton key={index} />
            ))}
          </View>
        ) : enrolledSubjects.length > 0 ? (
          <View>
            {enrolledSubjects.map((subject, index) => {
              const colorScheme = getSubjectColor(index);
              const hasImage = !!subject.imagenUrl;
              const materialsForSubject = subjectMaterials[subject.id] ?? 0;
              const materialsLabel =
                materialsForSubject === 0
                  ? "Sin materiales"
                  : materialsForSubject === 1
                  ? "1 material"
                  : `${materialsForSubject} materiales`;
              const semesterLabel = formatSemestre(subject.semestre);
              return (
                <TouchableOpacity
                  key={subject.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("SubjectDetail", {
                      nombre: subject.nombre,
                      id: subject.id,
                      semestre: subject.semestre,
                      userId: user.uid,
                    })
                  }
                >
                  <Card style={styles.classroomCard} elevation={2}>
                    <View style={styles.cardHeader}>
                      {hasImage ? (
                        <>
                          <Image
                            source={{ uri: subject.imagenUrl }}
                            style={styles.cardHeaderImage}
                          />
                          <View style={styles.cardHeaderImageOverlay} />
                        </>
                      ) : (
                        <>
                          <View
                            style={[
                              styles.cardHeaderColor,
                              { backgroundColor: colorScheme.bg },
                            ]}
                          />
                          <View
                            style={[
                              styles.cardHeaderOverlayTint,
                              { backgroundColor: "rgba(0,0,0,0.2)" },
                            ]}
                          />
                          <View
                            style={[
                              styles.cardAccentCircle,
                              { backgroundColor: colorScheme.accent },
                            ]}
                          />
                          <View
                            style={[
                              styles.cardAccentStripe,
                              { backgroundColor: colorScheme.accent },
                            ]}
                          />
                        </>
                      )}
                      <View style={styles.cardHeaderContent}>
                        <View style={styles.cardBadgeRow}>
                          <View
                            style={[
                              styles.cardBadge,
                              styles.cardBadgeSecondary,
                              styles.cardBadgeMaterials,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={
                                materialsForSubject > 0
                                  ? "folder-multiple-outline"
                                  : "bookmark-outline"
                              }
                              size={14}
                              color="#fff"
                              style={styles.cardBadgeIcon}
                            />
                            <Text style={styles.cardBadgeText}>
                              {materialsLabel}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cardTitleBlock}>
                          <Text numberOfLines={2} style={styles.cardTitle}>
                            {subject.nombre}
                          </Text>
                          <Text style={styles.cardMetaInline}>
                            {semesterLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
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
      <SubjectsModal
        visible={modalVisible}
        onDismiss={handleCloseModal}
        enrolledSubjectIds={enrolledSubjectIds}
        userId={user.uid}
        newSubjectIds={newSubjectIds}
        newSubjectsNotifIds={newSubjectsNotifIds}
      />

      {/* Modal de perfil de usuario */}
      <UserProfileModal
        visible={userMenuVisible}
        onDismiss={() => setUserMenuVisible(false)}
      />
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
    marginBottom: 12,
  },
  headerContent: {
    padding: 20,
  },

  classroomCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    height: 150,
    position: "relative",
    overflow: "hidden",
  },
  /* background color block when no image */
  cardHeaderColor: {
    ...StyleSheet.absoluteFillObject,
  },
  /* image that fills header (covers the same area as the color block) */
  cardHeaderImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  /* dark overlay on top of image for contrast */
  cardHeaderImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardHeaderOverlayTint: {
    ...StyleSheet.absoluteFillObject,
  },
  cardAccentCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
    top: -40,
    right: -40,
    transform: [{ scale: 1.1 }],
  },
  cardAccentStripe: {
    position: "absolute",
    width: 220,
    height: 40,
    opacity: 0.25,
    bottom: -20,
    left: -40,
    transform: [{ rotate: "-25deg" }],
    borderRadius: 20,
  },
  cardHeaderContent: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    bottom: 12,
    justifyContent: "space-between",
    gap: 12,
  },
  cardBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  cardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBadgeIcon: {
    marginRight: 2,
  },
  cardBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  cardBadgeSecondary: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardBadgeMaterials: {
    marginLeft: "auto",
  },
  cardTitleBlock: {
    gap: 12,
  },
  cardTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardMetaInline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
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
  accordion: {
    backgroundColor: "transparent",
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
  emptyCard: {
    borderRadius: 12,
    padding: 32,
  },
  avatarButton: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
