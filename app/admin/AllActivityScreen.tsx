import { useTheme } from "@/contexts/ThemeContext";
import { ActivityLog } from "@/scripts/types/Activity.type";
import { obtenerActividadesRecientes } from "@/services/activity.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Divider, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AllActivityListSkeleton from "./ActivityListSkeleton";
import ActivityCard from "./components/ActivityCard";
import ActivityDetailModal from "./components/ActivityDetailModal";
const ITEMS_PER_PAGE = 20;

export default function AllActivityScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [activityModalVisible, setActivityModalVisible] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { activities: newActivities, lastVisible } = await obtenerActividadesRecientes(ITEMS_PER_PAGE);
      setActivities(newActivities);
      setLastDoc(lastVisible);
      setHasMore(newActivities.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error cargando actividades:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      const { activities: newActivities, lastVisible } = await obtenerActividadesRecientes(ITEMS_PER_PAGE, lastDoc);
      
      setActivities(prev => [...prev, ...newActivities]);
      setLastDoc(lastVisible);
      setHasMore(newActivities.length === ITEMS_PER_PAGE && activities.length + newActivities.length < 200);
    } catch (error) {
      console.error("Error cargando más actividades:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <Appbar.Header
        elevated
        style={{ backgroundColor: theme.colors.surface, paddingTop: insets.top }}
      >
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Toda la Actividad" />
      </Appbar.Header>

      {loading ? (
        <AllActivityListSkeleton/>
      ) : activities.length === 0 ? (
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
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.activityContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ActivityCard
                  activity={activity} 
                  onPress={() => {
                    setSelectedActivity(activity);
                    setActivityModalVisible(true);
                  }}
                />
                {index < activities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </View>

          {hasMore && (
            <View style={styles.loadMoreContainer}>
              <Button
                mode="outlined"
                onPress={loadMore}
                loading={loadingMore}
                disabled={loadingMore}
                icon="refresh"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            </View>
          )}

          {!hasMore && activities.length > 0 && (
            <View style={styles.endContainer}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {activities.length >= 200 
                  ? 'Has alcanzado el límite de 200 registros'
                  : 'No hay más actividad para mostrar'}
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
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
  activityContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});