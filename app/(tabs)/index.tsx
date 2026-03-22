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
  Dimensions,
  Easing,
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
  Button,
  Card,
  FAB,
  IconButton,
  Modal,
  Portal,
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

interface Announcement {
  id: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string;
  activo: boolean;
  updatedAtMs: number;
}


const SUBJECT_COLORS = [
  { bg: "#1976d2", accent: "#0d47a1" }, 
  { bg: "#388e3c", accent: "#1b5e20" }, 
  { bg: "#f57c00", accent: "#ef6c00" }, 
  { bg: "#7b1fa2", accent: "#4a148c" }, 
  { bg: "#d32f2f", accent: "#b71c1c" }, 
  { bg: "#303f9f", accent: "#1a237e" }, 
  { bg: "#0097a7", accent: "#006064" }, 
  { bg: "#689f38", accent: "#33691e" }, 
];

type SortMode = "semestre" | "nombre";
type SortDir = "asc" | "desc";

const SORT_STORAGE_KEY = "@home_sort_mode";
const SORT_DIR_KEY = "@home_sort_dir";


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
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [modalAnnouncementIndex, setModalAnnouncementIndex] = useState(0);
  const [announcementImageRatios, setAnnouncementImageRatios] = useState<Record<string, number>>({});
  const [displayedAnnouncement, setDisplayedAnnouncement] = useState<Announcement | null>(null);
  const announcementTransition = useRef(new Animated.Value(1)).current;
  const displayedAnnouncementIdRef = useRef<string | null>(null);
  const isAnnouncementAnimatingRef = useRef(false);
  const announcementIndexRef = useRef(0);
  const autoOpenedModalAnnouncementIdRef = useRef<string | null>(null);
  const modalAutoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalCarouselRef = useRef<FlatList<Announcement> | null>(null);
  const modalSlideWidth = Math.max(260, Dimensions.get("window").width - 32);

  const getTimestampMillis = (value: unknown): number => {
    if (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
      return ((value as { toDate: () => Date }).toDate().getTime());
    }
    return 0;
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
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

  const enrolledSubjects = useMemo(() => {
    const subjects = [...enrolledSubjectsRaw];
    const dir = sortDir === "asc" ? 1 : -1;

    if (sortMode === "nombre") {
      return subjects.sort(
        (a, b) => dir * (a.nombre || "").localeCompare(b.nombre || ""),
      );
    }
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

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [enrolledSubjectIds]);

  useEffect(() => {
    if (!user) return;

    const activeAnnouncementsQuery = query(
      collection(db, "anuncios"),
      where("activo", "==", true),
    );

    const unsub = onSnapshot(
      activeAnnouncementsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((announcementDoc) => {
          const data = announcementDoc.data() as {
            titulo?: unknown;
            mensaje?: unknown;
            imagenUrl?: unknown;
            activo?: unknown;
            updatedAt?: unknown;
            createdAt?: unknown;
          };
          return {
            id: announcementDoc.id,
            titulo: typeof data.titulo === "string" ? data.titulo : "",
            mensaje: typeof data.mensaje === "string" ? data.mensaje : "",
            imagenUrl: typeof data.imagenUrl === "string" ? data.imagenUrl : "",
            activo: Boolean(data.activo),
            updatedAtMs:
              getTimestampMillis(data.updatedAt) ||
              getTimestampMillis(data.createdAt),
          } as Announcement;
        });

        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setActiveAnnouncements(list);
        setAnnouncementIndex((prev) => (list.length > 0 ? prev % list.length : 0));
      },
      (error) => {
        console.warn("No se pudo leer anuncios activos:", error);
        setActiveAnnouncements([]);
        setAnnouncementIndex(0);
      },
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    announcementIndexRef.current = announcementIndex;
  }, [announcementIndex]);

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const timer = setInterval(() => {
      if (announcementModalVisible) return;
      if (isAnnouncementAnimatingRef.current) return;
      isAnnouncementAnimatingRef.current = true;

      Animated.timing(announcementTransition, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        const next = (announcementIndexRef.current + 1) % activeAnnouncements.length;
        const nextAnnouncement = activeAnnouncements[next];
        announcementIndexRef.current = next;
        setAnnouncementIndex(next);
        setDisplayedAnnouncement(nextAnnouncement);
        displayedAnnouncementIdRef.current = nextAnnouncement?.id ?? null;
        announcementTransition.setValue(0);
        requestAnimationFrame(() => {
          Animated.timing(announcementTransition, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            isAnnouncementAnimatingRef.current = false;
          });
        });
      });
    }, 4200);
    return () => clearInterval(timer);
  }, [activeAnnouncements, announcementModalVisible, announcementTransition]);

  const currentAnnouncement = useMemo(() => {
    if (activeAnnouncements.length === 0) return null;
    return activeAnnouncements[announcementIndex % activeAnnouncements.length];
  }, [activeAnnouncements, announcementIndex]);
  const announcementPreviewItem = displayedAnnouncement ?? currentAnnouncement;

  useEffect(() => {
    if (!currentAnnouncement) {
      setDisplayedAnnouncement(null);
      displayedAnnouncementIdRef.current = null;
      announcementTransition.setValue(1);
      return;
    }

    const visibleId = displayedAnnouncementIdRef.current;
    const visibleStillExists = visibleId
      ? activeAnnouncements.some((announcement) => announcement.id === visibleId)
      : false;

    if (!visibleStillExists) {
      setDisplayedAnnouncement(currentAnnouncement);
      displayedAnnouncementIdRef.current = currentAnnouncement.id;
      announcementTransition.setValue(1);
    }
  }, [activeAnnouncements, announcementTransition, currentAnnouncement]);

  const previewAnnouncementIndex = useMemo(() => {
    if (!announcementPreviewItem) return 0;
    const index = activeAnnouncements.findIndex(
      (announcement) => announcement.id === announcementPreviewItem.id,
    );
    return index >= 0 ? index : announcementIndex;
  }, [activeAnnouncements, announcementIndex, announcementPreviewItem]);
  const modalAnnouncements = useMemo(() => {
    if (activeAnnouncements.length > 0) return activeAnnouncements;
    return announcementPreviewItem ? [announcementPreviewItem] : [];
  }, [activeAnnouncements, announcementPreviewItem]);

  useEffect(() => {
    const urls = modalAnnouncements
      .map((announcement) => announcement.imagenUrl || "")
      .filter((url) => Boolean(url) && announcementImageRatios[url] == null);
    if (urls.length === 0) return;

    urls.forEach((url) => {
      Image.getSize(
        url,
        (width, height) => {
          if (!width || !height) return;
          const ratio = width / height;
          if (!Number.isFinite(ratio) || ratio <= 0) return;
          setAnnouncementImageRatios((prev) => {
            if (prev[url] != null) return prev;
            return { ...prev, [url]: ratio };
          });
        },
        () => {},
      );
    });
  }, [announcementImageRatios, modalAnnouncements]);

  const handleOpenAnnouncementModal = () => {
    if (!announcementPreviewItem) return;
    const tappedIndex = activeAnnouncements.findIndex(
      (announcement) => announcement.id === announcementPreviewItem.id,
    );
    setModalAnnouncementIndex(tappedIndex >= 0 ? tappedIndex : 0);
    setAnnouncementModalVisible(true);
  };

  const handleCloseAnnouncementModal = () => {
    setAnnouncementModalVisible(false);
  };

  useEffect(() => {
    if (!isFocused || activeAnnouncements.length === 0) return;
    const latest = activeAnnouncements[0];
    if (!latest || announcementModalVisible) return;
    if (autoOpenedModalAnnouncementIdRef.current === latest.id) return;

    if (modalAutoOpenTimerRef.current) {
      clearTimeout(modalAutoOpenTimerRef.current);
    }

    modalAutoOpenTimerRef.current = setTimeout(() => {
      autoOpenedModalAnnouncementIdRef.current = latest.id;
      setModalAnnouncementIndex(0);
      setAnnouncementModalVisible(true);
    }, 900);
  }, [activeAnnouncements, announcementModalVisible, isFocused]);

  useEffect(() => {
    return () => {
      if (modalAutoOpenTimerRef.current) {
        clearTimeout(modalAutoOpenTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!announcementModalVisible) return;
    if (modalAnnouncements.length === 0) return;
    const safeIndex = Math.max(
      0,
      Math.min(modalAnnouncementIndex, modalAnnouncements.length - 1),
    );
    requestAnimationFrame(() => {
      modalCarouselRef.current?.scrollToOffset({
        offset: safeIndex * modalSlideWidth,
        animated: false,
      });
    });
  }, [announcementModalVisible, modalAnnouncementIndex, modalAnnouncements, modalSlideWidth]);

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

                {announcementPreviewItem ? (
                  <TouchableOpacity
                    style={[
                      styles.announcementPreview,
                      {
                        backgroundColor: theme.colors.elevation.level2,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={handleOpenAnnouncementModal}
                  >
                    <View style={styles.announcementPreviewHeader}>
                      <MaterialCommunityIcons
                        name="bullhorn-outline"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text
                        variant="labelMedium"
                        style={{ color: theme.colors.primary, fontWeight: "700" }}
                      >
                        Anuncio
                      </Text>
                      {activeAnnouncements.length > 1 ? (
                        <Text
                          variant="labelSmall"
                          style={{ color: theme.colors.onSurfaceVariant, marginLeft: "auto" }}
                    >
                      {previewAnnouncementIndex + 1}/{activeAnnouncements.length}
                    </Text>
                  ) : null}
                    </View>
                    <Animated.View
                      style={{
                        opacity: announcementTransition,
                        transform: [
                          {
                            translateY: announcementTransition.interpolate({
                              inputRange: [0, 1],
                              outputRange: [5, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <Text
                        variant="bodyMedium"
                        numberOfLines={1}
                        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
                      >
                        {announcementPreviewItem.titulo}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                ) : null}
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

      <FAB
        icon="tune"
        style={styles.fab}
        onPress={handleOpenModal}
        label="Materias"
      />

      <SubjectsModal
        visible={modalVisible}
        onDismiss={handleCloseModal}
        enrolledSubjectIds={enrolledSubjectIds}
        userId={user.uid}
        newSubjectIds={newSubjectIds}
        newSubjectsNotifIds={newSubjectsNotifIds}
      />

      <Portal>
        <Modal
          visible={announcementModalVisible && modalAnnouncements.length > 0}
          onDismiss={handleCloseAnnouncementModal}
          contentContainerStyle={[
            styles.announcementModal,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <FlatList
            ref={modalCarouselRef}
            data={modalAnnouncements}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={styles.announcementCarousel}
            getItemLayout={(_, index) => ({
              length: modalSlideWidth,
              offset: modalSlideWidth * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const nextIndex = Math.round(offsetX / modalSlideWidth);
              const safeIndex = Math.max(
                0,
                Math.min(nextIndex, modalAnnouncements.length - 1),
              );
              setModalAnnouncementIndex(safeIndex);
            }}
            renderItem={({ item }) => (
              <View style={[styles.announcementSlide, { width: modalSlideWidth }]}>
                {item.imagenUrl ? (
                  <Image
                    source={{ uri: item.imagenUrl }}
                    style={[
                      styles.announcementModalImage,
                      {
                        aspectRatio:
                          announcementImageRatios[item.imagenUrl] || 16 / 9,
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : null}
                <Text
                  variant="titleLarge"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: "800",
                    marginBottom: 8,
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  {item.titulo || "Anuncio"}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    lineHeight: 21,
                    marginBottom: 4,
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  {item.mensaje || ""}
                </Text>
              </View>
            )}
          />
          {modalAnnouncements.length > 1 ? (
            <View style={styles.announcementDotsRow}>
              {modalAnnouncements.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.announcementDot,
                    index === modalAnnouncementIndex && styles.announcementDotActive,
                    {
                      backgroundColor:
                        index === modalAnnouncementIndex
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
          <View style={styles.announcementActions}>
            <Button mode="contained" onPress={handleCloseAnnouncementModal}>
              Entendido
            </Button>
          </View>
        </Modal>
      </Portal>

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
    position: "relative",
    overflow: "hidden",
    aspectRatio: 21 / 9,
  },
  cardHeaderColor: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeaderImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
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
  announcementPreview: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  announcementPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  announcementModal: {
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    overflow: "hidden",
  },
  announcementCarousel: {
    width: "100%",
  },
  announcementSlide: {
    paddingHorizontal: 16,
    minHeight: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  announcementModalImage: {
    width: "92%",
    maxHeight: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  announcementDotsRow: {
    marginTop: 12,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  announcementDotActive: {
    width: 18,
    borderRadius: 6,
    opacity: 1,
  },
  announcementActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
