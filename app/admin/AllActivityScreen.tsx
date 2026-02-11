import React, { useEffect, useState, useRef } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Appbar, Card, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import ActivityCard from "./components/ActivityCard";
import ActivityDetailModal from "./components/ActivityDetailModal";
import Pagination from "./components/Pagination";
import { ActivityListSkeleton } from "./components/SkeletonLoaders";
import { obtenerActividadesPorPagina } from "@/services/activity.service";
import { ActivityLog } from "@/scripts/types/Activity.type";

const ITEMS_PER_PAGE = 25;

export default function AllActivityScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [pageCache, setPageCache] = useState<Map<number, ActivityLog[]>>(new Map());
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    loadActivities(currentPage);
    if (currentPage > 1) {
      preloadPage(currentPage - 1);
    }
    if (currentPage < totalPages) {
      preloadPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const preloadPage = async (page: number) => {
    if (pageCache.has(page)) return;

    if (page < 1 || page > totalPages) return;
    
    try {
      const { activities: newActivities } = await obtenerActividadesPorPagina(page, ITEMS_PER_PAGE);
      setPageCache(prev => new Map(prev).set(page, newActivities));
    } catch (error) {
      console.error(`Error precargando página ${page}:`, error);
    }
  };

  const loadActivities = async (page: number) => {
    try {
      setLoading(true);
      
      if (pageCache.has(page)) {
        setActivities(pageCache.get(page)!);
        setLoading(false);
        return;
      }
      
      const { activities: newActivities, totalCount: count } = await obtenerActividadesPorPagina(page, ITEMS_PER_PAGE);
      setActivities(newActivities);
      setTotalCount(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      setPageCache(prev => new Map(prev).set(page, newActivities));
    } catch (error) {
      console.error("Error cargando actividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    try {
      scrollRef.current?.scrollTo({ 
        y: 0, 
        animated: true 
      });
    } catch (e) {
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Toda la Actividad" />
      </Appbar.Header>

      {loading ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ActivityListSkeleton count={12} />
        </ScrollView>
      ) : totalCount === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="history"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No hay actividad registrada
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.activityList}>
              {activities.map((activity) => (
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loading}
            />

            <View style={styles.resultsInfoBottom}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} actividades
              </Text>
            </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  resultsInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  activityContainer: {
    marginBottom: 16,
  },
  activityList: {
    gap: 8,
    marginBottom: 16,
  },
  activityItemCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  resultsInfoBottom: {
    marginTop: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
});
