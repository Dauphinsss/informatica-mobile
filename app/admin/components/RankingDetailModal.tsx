import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import {
  Portal,
  Modal,
  Text,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  List,
  Chip,
  Divider,
} from "react-native-paper";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TimeFilter,
  PostSortType,
  UserRanking,
  SubjectRanking,
  PostRanking,
  ChartDataPoint,
} from "@/scripts/types/Statistics.type";
import {
  getTopActiveUsers,
  getTopPopularSubjects,
  getTopReportedUsers,
  getTopPopularPosts,
  generateChartData,
} from "@/services/statistics.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface RankingDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  rankingType: "activeUsers" | "popularSubjects" | "reportedUsers" | "popularPosts";
  icon: string;
}

export default function RankingDetailModal({
  visible,
  onDismiss,
  title,
  rankingType,
  icon,
}: RankingDetailModalProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30days");
  const [postSortType, setPostSortType] = useState<PostSortType>("views");
  const [topItems, setTopItems] = useState<(UserRanking | SubjectRanking | PostRanking)[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, timeFilter, postSortType, rankingType]);

  const loadData = async () => {
    setLoading(true);
    try {
      let items: any[] = [];
      let chart: ChartDataPoint[] = [];

      switch (rankingType) {
        case "activeUsers":
          items = await getTopActiveUsers(timeFilter);
          chart = await generateChartData("activeUsers", timeFilter);
          break;
        case "popularSubjects":
          items = await getTopPopularSubjects(timeFilter);
          chart = await generateChartData("popularSubjects", timeFilter);
          break;
        case "reportedUsers":
          items = await getTopReportedUsers(timeFilter);
          chart = await generateChartData("reportedUsers", timeFilter);
          break;
        case "popularPosts":
          items = await getTopPopularPosts(timeFilter, postSortType);
          chart = await generateChartData("popularPosts", timeFilter, postSortType);
          break;
      }

      setTopItems(items);
      setChartData(chart);
    } catch (error) {
      console.error("Error cargando datos del ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderListItem = (item: UserRanking | SubjectRanking | PostRanking, index: number) => {
    if (rankingType === "activeUsers" || rankingType === "reportedUsers") {
      const user = item as UserRanking;
      return (
        <View key={user.uid}>
          <List.Item
            title={`${index + 1}. ${user.nombre}`}
            description={user.email}
            left={(props) => (
              <List.Icon
                {...props}
                icon="account-circle"
                color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : theme.colors.primary}
              />
            )}
            right={() => (
              <Chip compact>
                {user.value} {rankingType === "activeUsers" ? "posts" : "reportes"}
              </Chip>
            )}
          />
          {index < topItems.length - 1 && <Divider />}
        </View>
      );
    } else if (rankingType === "popularSubjects") {
      const subject = item as SubjectRanking;
      return (
        <View key={subject.uid}>
          <List.Item
            title={`${index + 1}. ${subject.nombre}`}
            description={subject.descripcion}
            left={(props) => (
              <List.Icon
                {...props}
                icon="book-open-variant"
                color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : theme.colors.primary}
              />
            )}
            right={() => <Chip compact>{subject.value} publicaciones</Chip>}
          />
          {index < topItems.length - 1 && <Divider />}
        </View>
      );
    } else if (rankingType === "popularPosts") {
      const post = item as PostRanking;
      return (
        <View key={post.uid}>
          <List.Item
            title={`${index + 1}. ${post.titulo}`}
            description={`Por ${post.autorNombre}${post.materiaNombre ? ` • ${post.materiaNombre}` : ""}`}
            left={(props) => (
              <List.Icon
                {...props}
                icon="file-document"
                color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : theme.colors.primary}
              />
            )}
            right={() => (
              <View style={{ alignItems: "flex-end" }}>
                <Chip compact style={{ marginBottom: 4 }}>
                  {post.views} vistas
                </Chip>
                <Chip compact>
                  {post.likes} likes
                </Chip>
              </View>
            )}
          />
          {index < topItems.length - 1 && <Divider />}
        </View>
      );
    }
    return null;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: "bold" }}>
              {title}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              iconColor={theme.colors.onSurface}
            />
          </View>

          <Divider style={{ marginBottom: 16 }} />

          <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Período de tiempo
          </Text>
          <SegmentedButtons
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value as TimeFilter)}
            buttons={[
              { value: "today", label: "Hoy" },
              { value: "7days", label: "7 días" },
              { value: "30days", label: "30 días" },
              { value: "6months", label: "6 meses" },
              { value: "all", label: "Todo" },
            ]}
            style={styles.segmentedButtons}
            density="small"
          />

          {rankingType === "popularPosts" && (
            <>
              <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Ordenar por
              </Text>
              <SegmentedButtons
                value={postSortType}
                onValueChange={(value) => setPostSortType(value as PostSortType)}
                buttons={[
                  { value: "views", label: "Vistas", icon: "eye" },
                  { value: "likes", label: "Likes", icon: "thumb-up" },
                ]}
                style={styles.segmentedButtons}
              />
            </>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                Cargando datos...
              </Text>
            </View>
          ) : (
            <>
              {chartData.length > 0 && (
                <View style={styles.chartContainer}>
                  <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Tendencia
                  </Text>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={chartData}
                      width={SCREEN_WIDTH * 0.8 - 40}
                      height={220}
                      color={theme.colors.primary}
                      thickness={3}
                      startFillColor={theme.colors.primary}
                      endFillColor={theme.colors.background}
                      startOpacity={0.4}
                      endOpacity={0.1}
                      initialSpacing={0}
                      spacing={chartData.length > 10 ? 30 : 50}
                      noOfSections={5}
                      yAxisColor={theme.colors.outline}
                      xAxisColor={theme.colors.outline}
                      yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                      xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                      curved
                      areaChart
                      hideDataPoints={chartData.length > 20}
                      dataPointsColor={theme.colors.primary}
                      dataPointsRadius={4}
                    />
                  </View>
                </View>
              )}

              <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Top 10
              </Text>

              {topItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    No hay datos disponibles para este período
                  </Text>
                </View>
              ) : (
                <View style={[styles.listContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
                  {topItems.map((item, index) => renderListItem(item, index))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    marginHorizontal: "5%",
    marginVertical: 40,
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  chartContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  chartWrapper: {
    alignItems: "center",
    paddingVertical: 16,
  },
  listContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});