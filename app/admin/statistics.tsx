import { useTheme } from "@/contexts/ThemeContext";
import { GeneralStats, PostSortType, RankingStats, TimeFilter } from "@/scripts/types/Statistics.type";
import {
    getGeneralStats,
    getRankingStats,
} from "@/services/statistics.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Appbar, Button, Divider, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GeneralStatDetailModal from "./components/GeneralStatDetailModal";
import RankingDetailModal from "./components/RankingDetailModal";
import StatCardGeneral from "./components/StatCardGeneral";
import StatCardRanking from "./components/StatCardRanking";
import { getStyles } from "./statistics.styles";

type RankingModalType = "activeUsers" | "popularSubjects" | "reportedUsers" | "popularPosts" | null;
type GeneralStatType = "users" | "posts" | "pendingReports" | "totalReports" | null;
interface RankingModalState {
  timeFilter: TimeFilter;
  postSortType: PostSortType;
  cache: Map<string, { items: any[], chart: any[] }>;
}

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<RankingModalType>(null);
  const [generalModalVisible, setGeneralModalVisible] = useState(false);
  const [selectedGeneralStat, setSelectedGeneralStat] = useState<GeneralStatType>(null);
  const [rankingModalStates, setRankingModalStates] = useState<Record<string, RankingModalState>>({
    activeUsers: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    popularSubjects: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    reportedUsers: { timeFilter: "30days", postSortType: "views", cache: new Map() },
    popularPosts: { timeFilter: "30days", postSortType: "views", cache: new Map() },
  });

  useEffect(() => {
    loadGeneralStats();
  }, []);

  const loadGeneralStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const general = await getGeneralStats();
      setGeneralStats(general);
      loadRankingStats();
    } catch (err) {
      console.error("Error cargando estadísticas generales:", err);
      setError("No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const loadRankingStats = async () => {
    try {
      const rankings = await getRankingStats();
      setRankingStats(rankings);
    } catch (err) {
      console.error("Error cargando Rankings:", err);
    }
  };

  const openRankingModal = (type: RankingModalType) => {
    setSelectedRanking(type);
    setModalVisible(true);
  };

  const closeRankingModal = () => {
    setModalVisible(false);
    setSelectedRanking(null);
  };

  const openGeneralStatModal = (type: GeneralStatType) => {
    setSelectedGeneralStat(type);
    setGeneralModalVisible(true);
  };

  const closeGeneralStatModal = () => {
    setGeneralModalVisible(false);
    setSelectedGeneralStat(null);
  };

  const getGeneralStatData = () => {
    if (!generalStats || !selectedGeneralStat) {
      return { title: "", total: 0, current: 0, previous: 0, percentageChange: 0 };
    }

    switch (selectedGeneralStat) {
      case "users":
        return {
          title: "Usuarios Totales",
          total: generalStats.totalUsersInSystem,
          current: generalStats.totalUsers,
          previous: generalStats.totalUsersPrevious,
          percentageChange: generalStats.totalUsersChange,
        };
      case "posts":
        return {
          title: "Publicaciones Activas",
          total: generalStats.activePostsInSystem,
          current: generalStats.activePosts,
          previous: generalStats.activePostsPrevious,
          percentageChange: generalStats.activePostsChange,
        };
      case "pendingReports":
        return {
          title: "Reportes Pendientes",
          total: generalStats.pendingReportsInSystem,
          current: generalStats.pendingReports,
          previous: generalStats.pendingReportsPrevious,
          percentageChange: generalStats.pendingReportsChange,
        };
      case "totalReports":
        return {
          title: "Total de Reportes",
          total: generalStats.totalReportsInSystem,
          current: generalStats.totalReports,
          previous: generalStats.totalReportsPrevious,
          percentageChange: generalStats.totalReportsChange,
        };
      default:
        return { title: "", total: 0, current: 0, previous: 0, percentageChange: 0 };
    }
  };

  const getModalConfig = () => {
    switch (selectedRanking) {
      case "activeUsers":
        return { title: "Usuarios Más Activos", icon: "account-star" };
      case "popularSubjects":
        return { title: "Materias Más Populares", icon: "fire" };
      case "reportedUsers":
        return { title: "Usuarios Más Reportados", icon: "alert-octagon" };
      case "popularPosts":
        return { title: "Publicaciones Más Populares", icon: "trending-up" };
      default:
        return { title: "", icon: "information" };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Estadísticas" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando estadísticas...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Estadísticas" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Button mode="contained" onPress={loadGeneralStats}>
            Reintentar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Estadísticas" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleLarge" style={styles.sectionTitle}>
          General
        </Text>

        {generalStats && (
          <>
            <View style={styles.cardsGrid}>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Usuarios Totales"
                  value={generalStats.totalUsers}
                  percentageChange={generalStats.totalUsersChange}
                  description="Usuarios registrados en la plataforma"
                  icon="account-group"
                  onPress={() => openGeneralStatModal("users")}
                />
              </View>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Publicaciones Activas"
                  value={generalStats.activePosts}
                  percentageChange={generalStats.activePostsChange}
                  description="Publicaciones disponibles actualmente"
                  icon="file-document-multiple"
                  onPress={() => openGeneralStatModal("posts")}
                />
              </View>
            </View>

            <View style={styles.cardsGrid}>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Reportes Pendientes"
                  value={generalStats.pendingReports}
                  percentageChange={generalStats.pendingReportsChange}
                  description="Reportes esperando revisión"
                  icon="alert-circle"
                  onPress={() => openGeneralStatModal("pendingReports")}
                />
              </View>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Total de Reportes"
                  value={generalStats.totalReports}
                  percentageChange={generalStats.totalReportsChange}
                  description="Reportes totales recibidos"
                  icon="alert-octagon"
                  onPress={() => openGeneralStatModal("totalReports")}
                />
              </View>
            </View>
          </>
        )}

        <Divider style={styles.dividerSection} />

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Rankings
        </Text>

        {rankingStats && (
          <>
            <View style={styles.cardsGrid}>
              <View style={styles.cardHalf}>
                {rankingStats.mostActiveUser ? (
                  <StatCardRanking
                    title="Usuario Más Activo"
                    topItemName={rankingStats.mostActiveUser.nombre}
                    value={rankingStats.mostActiveUser.value}
                    valueLabel="publicaciones"
                    icon="account-star"
                    onPress={() => openRankingModal("activeUsers")}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Sin datos disponibles</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardHalf}>
                {rankingStats.hottestSubject ? (
                  <StatCardRanking
                    title="Materia Más Popular"
                    topItemName={rankingStats.hottestSubject.nombre}
                    value={rankingStats.hottestSubject.value}
                    valueLabel="publicaciones"
                    icon="fire"
                    onPress={() => openRankingModal("popularSubjects")}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Sin datos disponibles</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardsGrid}>
              <View style={styles.cardHalf}>
                {rankingStats.mostReportedUser ? (
                  <StatCardRanking
                    title="Usuario Más Reportado"
                    topItemName={rankingStats.mostReportedUser.nombre}
                    value={rankingStats.mostReportedUser.value}
                    valueLabel="reportes"
                    icon="alert-octagon"
                    onPress={() => openRankingModal("reportedUsers")}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Sin datos disponibles</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardHalf}>
                {rankingStats.mostPopularPost ? (
                  <StatCardRanking
                    title="Publicación Más Popular"
                    topItemName={rankingStats.mostPopularPost.titulo}
                    value={rankingStats.mostPopularPost.views}
                    valueLabel="vistas"
                    icon="trending-up"
                    onPress={() => openRankingModal("popularPosts")}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Sin datos disponibles</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {selectedRanking && (
        <RankingDetailModal
          visible={modalVisible}
          onDismiss={closeRankingModal}
          title={getModalConfig().title}
          rankingType={selectedRanking}
          icon={getModalConfig().icon}
          timeFilter={rankingModalStates[selectedRanking].timeFilter}
          postSortType={rankingModalStates[selectedRanking].postSortType}
          cache={rankingModalStates[selectedRanking].cache}
          onTimeFilterChange={(filter) => {
            setRankingModalStates(prev => ({
              ...prev,
              [selectedRanking]: { ...prev[selectedRanking], timeFilter: filter }
            }));
          }}
          onPostSortTypeChange={(sortType) => {
            setRankingModalStates(prev => ({
              ...prev,
              [selectedRanking]: { ...prev[selectedRanking], postSortType: sortType }
            }));
          }}
          onCacheUpdate={(cache) => {
            setRankingModalStates(prev => ({
              ...prev,
              [selectedRanking]: { ...prev[selectedRanking], cache }
            }));
          }}
        />
      )}

      {selectedGeneralStat && (
        <GeneralStatDetailModal
          visible={generalModalVisible}
          onDismiss={closeGeneralStatModal}
          {...getGeneralStatData()}
        />
      )}
    </View>
  );
}