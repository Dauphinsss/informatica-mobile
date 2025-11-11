import { useTheme } from "@/contexts/ThemeContext";
import { GeneralStatType } from "@/scripts/types/Statistics.type";
import { getGeneralStats, getRankingStats } from "@/services/statistics.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import GeneralStatDetailModal from "../components/GeneralStatDetailModal";
import { CardSkeleton } from "../components/SkeletonLoaders";
import StatCardGeneral from "../components/StatCardGeneral";
import { useStatistics } from "../contexts/StatisticsContext";
import { getStyles } from "../statistics.styles";

export default function GeneralScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const {
    generalStats,
    setGeneralStats,
    generalLoading,
    setGeneralLoading,
    error,
    setError,
    setRankingLoading,
    setRankingStats,
  } = useStatistics();

  const [generalModalVisible, setGeneralModalVisible] = useState(false);
  const [selectedGeneralStat, setSelectedGeneralStat] = useState<GeneralStatType>(null);

  useEffect(() => {
    if (!generalStats && !generalLoading) {
      loadGeneralStats();
    }
  }, []);

  const loadGeneralStats = async () => {
    try {
      setError(null);
      setGeneralLoading(true);
      const general = await getGeneralStats();
      setGeneralStats(general);
      
      setRankingLoading(true);
      (async () => {
        try {
          const rankings = await getRankingStats();
          setRankingStats(rankings);
        } catch (err) {
          console.error('Error precargando rankings:', err);
        } finally {
          setRankingLoading(false);
        }
      })();
    } catch (err) {
      console.error("Error cargando estadísticas generales:", err);
      setError("No se pudieron cargar las estadísticas. Por favor, intenta de nuevo.");
    } finally {
      setGeneralLoading(false);
    }
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

  if (generalLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View style={styles.cardsGrid}>
            <View style={styles.cardHalf}>
              <CardSkeleton />
            </View>
            <View style={styles.cardHalf}>
              <CardSkeleton />
            </View>
          </View>

          <View style={styles.cardsGrid}>
            <View style={styles.cardHalf}>
              <CardSkeleton />
            </View>
            <View style={styles.cardHalf}>
              <CardSkeleton />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error && !generalStats) {
    return (
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
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
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
      </ScrollView>

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