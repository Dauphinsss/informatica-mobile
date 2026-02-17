
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { ActivityLog } from "@/scripts/types/Activity.type";
import { escucharActividadesRecientes } from "@/services/activity.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, Card, Text } from "react-native-paper";
import { ActivityListSkeleton } from "../admin/components/SkeletonLoaders";
import ActivityCard from "../admin/components/ActivityCard";
import ActivityDetailModal from "../admin/components/ActivityDetailModal";


type AdminStackParamList = {
  Admin: undefined;
  ManageUsers: undefined;
  ManageTeachers: undefined;
  ManageSections: undefined;
  Reports: undefined;
  ManageSubjects: undefined;
  PendingPublications: undefined;
  Statistics: undefined;
};

type AdminScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "Admin"
>;

function AnimatedStatNumber({
  value,
  loading,
  style,
}: {
  value: number;
  loading: boolean;
  style?: any;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const currentValueRef = useRef(0);
  const randomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    currentValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    if (randomTimerRef.current) {
      clearInterval(randomTimerRef.current);
      randomTimerRef.current = null;
    }
    if (animateTimerRef.current) {
      clearInterval(animateTimerRef.current);
      animateTimerRef.current = null;
    }

    if (loading) {
      randomTimerRef.current = setInterval(() => {
        const top = Math.max(20, value + 25);
        const next = Math.floor(Math.random() * top);
        currentValueRef.current = next;
        setDisplayValue(next);
      }, 90);

      return () => {
        if (randomTimerRef.current) clearInterval(randomTimerRef.current);
      };
    }

    const start = currentValueRef.current;
    const end = value;
    const delta = end - start;
    if (delta === 0) {
      setDisplayValue(end);
      return;
    }

    const steps = 22;
    let step = 0;
    animateTimerRef.current = setInterval(() => {
      step += 1;
      const progress = step / steps;
      const next = Math.round(start + delta * progress);
      currentValueRef.current = next;
      setDisplayValue(next);

      if (step >= steps) {
        if (animateTimerRef.current) clearInterval(animateTimerRef.current);
        animateTimerRef.current = null;
        currentValueRef.current = end;
        setDisplayValue(end);
      }
    }, 30);

    return () => {
      if (randomTimerRef.current) clearInterval(randomTimerRef.current);
      if (animateTimerRef.current) clearInterval(animateTimerRef.current);
    };
  }, [loading, value]);

  return (
    <Text variant="displaySmall" style={style}>
      {displayValue}
    </Text>
  );
}

export default function AdminScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<AdminScreenNavigationProp>();

  
  const [totalMaterias, setTotalMaterias] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalDocentes, setTotalDocentes] = useState(0);
  const [totalSecciones, setTotalSecciones] = useState(0);
  const [denunciasPendientes, setDenunciasPendientes] = useState(0);
  const [publicacionesPendientes, setPublicacionesPendientes] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState({
    materias: false,
    usuarios: false,
    denuncias: false,
    pendientes: false,
    publicacionesPendientes: false,
    docentes: false,
    secciones: false,
  });
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  
  useEffect(() => {
    let mounted = true;

    
    const materiasRef = collection(db, "materias");
    const unsubMaterias = onSnapshot(materiasRef, (snapshot) => {
      if (mounted) {
        setTotalMaterias(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, materias: true }));
      }
    });

    
    const usuariosRef = collection(db, "usuarios");
    const unsubUsuarios = onSnapshot(usuariosRef, (snapshot) => {
      if (mounted) {
        setTotalUsuarios(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, usuarios: true }));
      }
    });

    
    const denunciasRef = collection(db, "reportes");
    const unsubDenuncias = onSnapshot(denunciasRef, () => {
      if (mounted) {
        setStatsLoaded((prev) => ({ ...prev, denuncias: true }));
      }
    });

    const docentesRef = collection(db, "docentes");
    const unsubDocentes = onSnapshot(docentesRef, (snapshot) => {
      if (mounted) {
        setTotalDocentes(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, docentes: true }));
      }
    });

    const seccionesRef = collection(db, "secciones");
    const unsubSecciones = onSnapshot(seccionesRef, (snapshot) => {
      if (mounted) {
        setTotalSecciones(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, secciones: true }));
      }
    });

    
    const denunciasPendientesQuery = query(
      collection(db, "reportes"),
      where("estado", "==", "pendiente")
    );
    const unsubPendientes = onSnapshot(denunciasPendientesQuery, (snapshot) => {
      if (mounted) {
        setDenunciasPendientes(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, pendientes: true }));
      }
    });

    const publicacionesPendientesQuery = query(
      collection(db, "publicaciones"),
      where("estado", "==", "pendiente")
    );
    const unsubPublicacionesPendientes = onSnapshot(
      publicacionesPendientesQuery,
      (snapshot) => {
        if (mounted) {
          setPublicacionesPendientes(snapshot.size);
          setStatsLoaded((prev) => ({ ...prev, publicacionesPendientes: true }));
        }
      },
    );

    return () => {
      mounted = false;
      unsubMaterias();
      unsubUsuarios();
      unsubDenuncias();
      unsubPendientes();
      unsubPublicacionesPendientes();
      unsubDocentes();
      unsubSecciones();
    };
  }, []);

  useEffect(() => {
    const allLoaded =
      statsLoaded.materias &&
      statsLoaded.usuarios &&
      statsLoaded.denuncias &&
      statsLoaded.pendientes &&
      statsLoaded.publicacionesPendientes &&
      statsLoaded.docentes &&
      statsLoaded.secciones;
    if (allLoaded) {
      setLoadingStats(false);
    }
  }, [statsLoaded]);

  useEffect(() => {
    setLoadingActivities(true);
    
    let unsubscribe: (() => void) | undefined;
    
    const timer = setTimeout(() => {
      unsubscribe = escucharActividadesRecientes(
        10,
        (activities) => {
          setRecentActivities(activities);
          
          setTimeout(() => setLoadingActivities(false), 300);
        }
      );
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Panel de Administración" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {}
        <Text variant="titleMedium" style={styles.mainTitle}>
          Gestión del Sistema
        </Text>

        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageSubjects")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={totalMaterias}
                    loading={loadingStats || !statsLoaded.materias}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Materias
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageSections")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="view-grid-outline"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={totalSecciones}
                    loading={loadingStats || !statsLoaded.secciones}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Secciones
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageTeachers")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={totalDocentes}
                    loading={loadingStats || !statsLoaded.docentes}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Docentes
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageUsers")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={totalUsuarios}
                    loading={loadingStats || !statsLoaded.usuarios}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Usuarios
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Reports")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="alert-octagon"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={denunciasPendientes}
                    loading={loadingStats || !statsLoaded.pendientes}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Denuncias
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("PendingPublications")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="newspaper-variant-multiple"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <AnimatedStatNumber
                    value={publicacionesPendientes}
                    loading={loadingStats || !statsLoaded.publicacionesPendientes}
                    style={styles.statNumber}
                  />
                  <Text
                    variant="bodySmall"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Pendientes
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actividad Reciente
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate("AllActivity" as any)}
              compact
            >
              Ver todo
            </Button>
          </View>

          {loadingActivities ? (
            <ActivityListSkeleton count={4} />
          ) : recentActivities.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivities.map((activity) => (
                <Card
                  key={activity.id}
                  elevation={1}
                  style={[
                    styles.activityItemCard,
                    { backgroundColor: theme.colors.elevation.level1 },
                  ]}
                >
                  <Card.Content style={{ padding: 0 }}>
                    <ActivityCard
                      activity={activity}
                      onPress={() => {
                        setSelectedActivity(activity);
                        setActivityModalVisible(true);
                      }}
                    />
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <Card elevation={1} style={styles.activityCard}>
              <Card.Content>
                <View style={styles.activityItem}>
                  <MaterialCommunityIcons
                    name="history"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[styles.activityText, { color: theme.colors.onSurfaceVariant }]}
                  >
                    No hay actividad reciente
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
      <ActivityDetailModal
        visible={activityModalVisible}
        activity={selectedActivity}
        onDismiss={() => {
          setActivityModalVisible(false);
          setSelectedActivity(null);
        }}
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
  mainTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    width: "31.5%",
    marginBottom: 10,
  },
  card: {
    borderRadius: 16,
    height: 138,
  },
  cardContent: {
    paddingVertical: 10,
    alignItems: "center",
    position: "relative",
    height: "100%",
    justifyContent: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statContent: {
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  statNumber: {
    fontWeight: "bold",
    marginBottom: 2,
    fontSize: 22,
    lineHeight: 24,
  },
  statLabel: {
    fontWeight: "500",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 14,
  },
  subLabel: {
    marginTop: 4,
    opacity: 0.6,
  },
  disabledCard: {
    opacity: 0.6,
  },
  comingSoon: {
    marginTop: 12,
    marginBottom: 4,
  },
  activitySection: {
    marginTop: 8,
    marginBottom: 32,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityCard: {
    borderRadius: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItemCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityText: {
    flex: 1,
    fontStyle: "italic",
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
