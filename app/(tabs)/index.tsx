import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { useCalcularSemestre } from "@/hooks/useCalcularSemestre";
import { CACHE_KEYS, getCache, setCache } from "@/services/cache.service";
import {
  setModalVisible as setGlobalModalCallback,
  setNewSubjectIds as setGlobalNewSubjectIds,
} from "@/services/navigationService";
import {
  escucharNotificaciones,
  NotificacionCompleta,
} from "@/services/notifications";
import { Pacifico_400Regular, useFonts } from "@expo-google-fonts/pacifico";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Badge,
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

type SortMode = "semestre" | "nombre";
type SortDir = "asc" | "desc";

const SORT_STORAGE_KEY = "@home_sort_mode";
const SORT_DIR_KEY = "@home_sort_dir";

// Componente para animar la entrada de cada card
function AnimatedCard({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
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
  const [newSubjectsNotifIds, setNewSubjectsNotifIds] = useState<
    Map<string, string>
  >(new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("semestre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Cargar datos del cache al instante
  useEffect(() => {
    (async () => {
      try {
        const cachedSubjects = await getCache<Subject[]>(CACHE_KEYS.subjects);
        if (cachedSubjects && cachedSubjects.length > 0) {
          setAllSubjects(cachedSubjects);
          setIsLoading(false);
        }
        const uid = auth.currentUser?.uid;
        if (uid) {
          const cachedUserData = await getCache<any>(CACHE_KEYS.userData(uid));
          if (cachedUserData) {
            setUserData(cachedUserData);
            const materias = Array.isArray(cachedUserData.materiasInscritas)
              ? cachedUserData.materiasInscritas.filter(
                  (id: any): id is string =>
                    typeof id === "string" && id.trim() !== "",
                )
              : [];
            setEnrolledSubjectIds(materias);
          }
          const cachedMaterials = await getCache<Record<string, number>>(
            CACHE_KEYS.subjectMaterials,
          );
          if (cachedMaterials) setSubjectMaterials(cachedMaterials);
        }
      } catch (e) {
        console.warn("[Cache] Error cargando cache Home:", e);
      }
    })();
  }, []);

  // Cargar preferencias de ordenamiento al montar
  useEffect(() => {
    const loadSortPreferences = async () => {
      try {
        const [savedSort, savedDir] = await Promise.all([
          AsyncStorage.getItem(SORT_STORAGE_KEY),
          AsyncStorage.getItem(SORT_DIR_KEY),
        ]);
        if (savedSort) setSortMode(savedSort as SortMode);
        if (savedDir) setSortDir(savedDir as SortDir);
      } catch (err) {
        console.warn("Error cargando preferencias de orden:", err);
      }
    };
    loadSortPreferences();
  }, []);

  // Ciclar modo de ordenamiento: semestre↑ → semestre↓ → nombre↑ → nombre↓
  const cycleSortMode = useCallback(async () => {
    let newMode = sortMode;
    let newDir = sortDir;

    if (sortMode === "semestre" && sortDir === "asc") {
      newDir = "desc";
    } else if (sortMode === "semestre" && sortDir === "desc") {
      newMode = "nombre";
      newDir = "asc";
    } else if (sortMode === "nombre" && sortDir === "asc") {
      newDir = "desc";
    } else {
      newMode = "semestre";
      newDir = "asc";
    }

    setSortMode(newMode);
    setSortDir(newDir);
    try {
      await Promise.all([
        AsyncStorage.setItem(SORT_STORAGE_KEY, newMode),
        AsyncStorage.setItem(SORT_DIR_KEY, newDir),
      ]);
    } catch (err) {
      console.warn("Error guardando preferencia de orden:", err);
    }
  }, [sortMode, sortDir]);

  // Pull to refresh — fuerza re-suscripción de todos los listeners
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Pequeño delay para feedback visual
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const enrolledSubjectsRaw = useMemo(() => {
    if (allSubjects.length === 0 || enrolledSubjectIds.length === 0) {
      return [];
    }
    const validIds = new Set(
      enrolledSubjectIds.filter(
        (id) => typeof id === "string" && id.trim() !== "",
      ),
    );
    return allSubjects.filter((subject) => validIds.has(subject.id));
  }, [allSubjects, enrolledSubjectIds]);

  // Materias ordenadas
  const enrolledSubjects = useMemo(() => {
    const subjects = [...enrolledSubjectsRaw];
    const dir = sortDir === "asc" ? 1 : -1;

    if (sortMode === "nombre") {
      return subjects.sort(
        (a, b) => dir * (a.nombre || "").localeCompare(b.nombre || ""),
      );
    }
    // semestre (default)
    return subjects.sort((a, b) => {
      const sa = Number(a.semestre ?? 0);
      const sb = Number(b.semestre ?? 0);
      if (sa !== sb) return dir * (sa - sb);
      return (a.nombre || "").localeCompare(b.nombre || "");
    });
  }, [enrolledSubjectsRaw, sortMode, sortDir]);

  const totalMaterials = useMemo(
    () =>
      enrolledSubjects.reduce(
        (acc, subject) => acc + (subjectMaterials[subject.id] ?? 0),
        0,
      ),
    [enrolledSubjects, subjectMaterials],
  );
  const totalMaterialsLabel = totalMaterials === 1 ? "Material" : "Materiales";
  const user = auth.currentUser;

  useCalcularSemestre(user?.uid, enrolledSubjectIds);

  useEffect(() => {
    setGlobalModalCallback(setModalVisible);
    setGlobalNewSubjectIds(setNewSubjectIds);
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

        const noLeidas = notifs.filter((n) => !n.leida).length;
        setUnreadCount(noLeidas);
      },
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
          setCache(CACHE_KEYS.userData(user.uid), data);
          const materias = Array.isArray(data.materiasInscritas)
            ? data.materiasInscritas.filter(
                (id): id is string =>
                  typeof id === "string" && id.trim() !== "",
              )
            : [];
          setEnrolledSubjectIds(materias);
        }
      });
      return () => unsubscribe();
    }
  }, [user, refreshKey]);

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

        const activeSubjects = subjectsList.filter(
          (s) => s.estado === "active",
        );
        setAllSubjects(activeSubjects);
        setCache(CACHE_KEYS.subjects, activeSubjects);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error al cargar materias:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [refreshKey]);

  useEffect(() => {
    if (enrolledSubjectIds.length === 0) {
      setSubjectMaterials({});
      return;
    }

    const uniqueSubjectIds = Array.from(new Set(enrolledSubjectIds));
    const publicacionesRef = collection(db, "publicaciones");
    const unsubscribes: (() => void)[] = [];

    // Crear un listener para cada materia inscrita
    uniqueSubjectIds.forEach((subjectId) => {
      const publicacionesQuery = query(
        publicacionesRef,
        where("materiaId", "==", subjectId),
        where("estado", "==", "activo"),
      );

      const unsubscribe = onSnapshot(
        publicacionesQuery,
        (snapshot) => {
          setSubjectMaterials((prev) => {
            const updated = {
              ...prev,
              [subjectId]: snapshot.size,
            };
            setCache(CACHE_KEYS.subjectMaterials, updated);
            return updated;
          });
        },
        (error) => {
          console.error(`Error al escuchar materiales de ${subjectId}:`, error);
        },
      );

      unsubscribes.push(unsubscribe);
    });

    // Cleanup: desuscribir todos los listeners
    return () => {
      unsubscribes.forEach((unsub) => unsub());
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
      <Appbar.Header style={{ height: 64, overflow: "visible" }}>
        <Appbar.Content
          title="Ing. Informática"
          titleStyle={{
            fontFamily: fontsLoaded ? "Pacifico_400Regular" : "serif",
            fontSize: 20,
            lineHeight: 36,
            paddingTop: 4,
          }}
          style={{ overflow: "visible", flex: 0, marginRight: "auto" }}
        />
        <TouchableOpacity
          onPress={cycleSortMode}
          style={[
            styles.sortButton,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={sortDir === "asc" ? "sort-ascending" : "sort-descending"}
            size={18}
            color={theme.colors.onSurface}
          />
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurface,
              marginLeft: 2,
              fontWeight: "600",
            }}
          >
            {sortMode === "semestre" ? "Sem" : "A–Z"}
          </Text>
        </TouchableOpacity>
        <View style={{ position: "relative", marginRight: 8 }}>
          <IconButton
            icon="bell"
            size={24}
            onPress={() => navigation.navigate("Notifications")}
          />
          {unreadCount > 0 && (
            <Badge
              style={{
                position: "absolute",
                top: 4,
                right: 4,
              }}
              size={18}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setUserMenuVisible(true)}
          style={styles.avatarButton}
        >
          <View style={{ position: "relative" }}>
            {user.photoURL ? (
              <Avatar.Image size={32} source={{ uri: user.photoURL }} />
            ) : (
              <Avatar.Text
                size={32}
                label={user.displayName?.charAt(0).toUpperCase() || "?"}
              />
            )}
            <AdminBadge size={32} isAdmin={userData?.rol === "admin"} />
          </View>
        </TouchableOpacity>
      </Appbar.Header>

      <FlatList
        data={isLoading ? [] : enrolledSubjects}
        keyExtractor={(item) => item.id}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.elevation.level2}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header con saludo y estadísticas */}
            <Surface style={styles.headerCard}>
              <View style={styles.headerContent}>
                <Text variant="headlineSmall">
                  ¡Hola,{" "}
                  {user.displayName?.split(" ")[0] ||
                    userData?.nombre ||
                    "Usuario"}
                  !
                </Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text
                      variant="headlineMedium"
                      style={[
                        styles.statNumber,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {enrolledSubjects.length}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Materias
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statDivider,
                      { backgroundColor: theme.colors.outlineVariant },
                    ]}
                  />
                  <View style={styles.statItem}>
                    <Text
                      variant="headlineMedium"
                      style={[
                        styles.statNumber,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {totalMaterials}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {totalMaterialsLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </Surface>

            {isLoading && (
              <View>
                {[1, 2, 3].map((index) => (
                  <SubjectCardSkeleton key={index} />
                ))}
              </View>
            )}
          </>
        }
        renderItem={({ item: subject, index }) => {
          const colorScheme = getSubjectColor(index ?? 0);
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
            <AnimatedCard index={index ?? 0}>
              <TouchableOpacity
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
            </AnimatedCard>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
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
          ) : null
        }
      />

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
    borderRadius: 16,
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },

  classroomCard: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: {
    height: 170,
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
    bottom: 14,
    justifyContent: "space-between",
    gap: 8,
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
    marginTop: 12,
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
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
