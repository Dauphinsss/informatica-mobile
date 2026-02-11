
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
  Reports: undefined;
  ManageSubjects: undefined;
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
  const [totalDenuncias, setTotalDenuncias] = useState(0);
  const [denunciasPendientes, setDenunciasPendientes] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState({
    materias: false,
    usuarios: false,
    denuncias: false,
    pendientes: false,
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
    const unsubDenuncias = onSnapshot(denunciasRef, (snapshot) => {
      if (mounted) {
        setTotalDenuncias(snapshot.size);
        setStatsLoaded((prev) => ({ ...prev, denuncias: true }));
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

    return () => {
      mounted = false;
      unsubMaterias();
      unsubUsuarios();
      unsubDenuncias();
      unsubPendientes();
    };
  }, []);

  useEffect(() => {
    const allLoaded =
      statsLoaded.materias &&
      statsLoaded.usuarios &&
      statsLoaded.denuncias &&
      statsLoaded.pendientes;
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

        {}
        <View style={styles.statsGrid}>
            {}
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
                      size={32}
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
                      variant="bodyLarge"
                      style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Materias
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.chevron}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>

            {}
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
                      size={32}
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
                      variant="bodyLarge"
                      style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Usuarios
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.chevron}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>

        {}
        <View style={styles.statsGrid}>
            {}
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
                      size={32}
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
                      variant="bodyLarge"
                      style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Denuncias
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {loadingStats || !statsLoaded.denuncias
                        ? "cargando..."
                        : `${totalDenuncias} total`}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.chevron}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Statistics")}
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
                      name="chart-bar"
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.statContent}>
                    <Text
                      variant="bodyLarge"
                      style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Estadísticas
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.chevron}
                  />
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
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    height: 200,
  },
  cardContent: {
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
    height: "100%",
    justifyContent: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statContent: {
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: "500",
  },
  subLabel: {
    marginTop: 4,
    opacity: 0.6,
  },
  chevron: {
    position: "absolute",
    top: 12,
    right: 12,
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
