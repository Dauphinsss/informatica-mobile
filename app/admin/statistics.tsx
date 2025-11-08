import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Appbar, Text, ActivityIndicator, Button, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { getStyles } from "./statistics.styles";
import StatCardGeneral from "./components/StatCardGeneral";
import StatCardRanking from "./components/StatCardRanking";
import RankingDetailModal from "./components/RankingDetailModal";
import {
  getGeneralStats,
  getRankingStats,
} from "@/services/statistics.service";
import { GeneralStats, RankingStats } from "@/scripts/types/Statistics.type";

type RankingModalType = "activeUsers" | "popularSubjects" | "reportedUsers" | "popularPosts" | null;

export default function StatisticsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [rankingStats, setRankingStats] = useState<RankingStats | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<RankingModalType>(null);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      setError(null);
      const [general, rankings] = await Promise.all([
        getGeneralStats(),
        getRankingStats(),
      ]);
      setGeneralStats(general);
      setRankingStats(rankings);
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
      setError("No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllStats();
  }, []);

  const openRankingModal = (type: RankingModalType) => {
    setSelectedRanking(type);
    setModalVisible(true);
  };

  const closeRankingModal = () => {
    setModalVisible(false);
    setSelectedRanking(null);
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
      <View style={styles.container}>
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
          <Button mode="contained" onPress={loadAllStats}>
            Reintentar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Estadísticas" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
                />
              </View>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Publicaciones Activas"
                  value={generalStats.activePosts}
                  percentageChange={generalStats.activePostsChange}
                  description="Publicaciones disponibles actualmente"
                  icon="file-document-multiple"
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
                />
              </View>
              <View style={styles.cardHalf}>
                <StatCardGeneral
                  title="Total de Reportes"
                  value={generalStats.totalReports}
                  percentageChange={generalStats.totalReportsChange}
                  description="Reportes totales recibidos"
                  icon="alert-octagon"
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

        <View style={{ height: 32 }} />
      </ScrollView>

      {selectedRanking && (
        <RankingDetailModal
          visible={modalVisible}
          onDismiss={closeRankingModal}
          title={getModalConfig().title}
          rankingType={selectedRanking}
          icon={getModalConfig().icon}
        />
      )}
    </View>
  );
}