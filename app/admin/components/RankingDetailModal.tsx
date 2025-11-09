import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import {
  Portal,
  Modal,
  Text,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  List,
  Divider,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  timeFilter: TimeFilter;
  postSortType: PostSortType;
  cache: Map<string, { items: any[], chart: ChartDataPoint[] }>;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onPostSortTypeChange: (sortType: PostSortType) => void;
  onCacheUpdate: (cache: Map<string, { items: any[], chart: ChartDataPoint[] }>) => void;
}

export default function RankingDetailModal({
  visible,
  onDismiss,
  title,
  rankingType,
  icon,
  timeFilter,
  postSortType,
  cache,
  onTimeFilterChange,
  onPostSortTypeChange,
  onCacheUpdate,
}: RankingDetailModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [topItems, setTopItems] = useState<(UserRanking | SubjectRanking | PostRanking)[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
      prefetchOtherFilters();
    }
  }, [visible, timeFilter, postSortType, rankingType]);

  const loadData = async () => {
    const cacheKey = `${rankingType}_${timeFilter}_${postSortType || 'default'}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      setTopItems(cached.items);
      setChartData(cached.chart);
      return;
    }

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
      
      const newCache = new Map(cache);
      newCache.set(cacheKey, { items, chart });
      onCacheUpdate(newCache);
    } catch (error) {
      console.error("Error cargando datos del ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const prefetchOtherFilters = async () => {
    const allFilters: TimeFilter[] = ["today", "7days", "30days", "6months", "all"];
    
    for (const filter of allFilters) {
      if (filter === timeFilter) continue;
      
      const cacheKey = `${rankingType}_${filter}_${postSortType || 'default'}`;
      if (cache.has(cacheKey)) continue;
      
      try {
        let items: any[] = [];
        let chart: ChartDataPoint[] = [];

        switch (rankingType) {
          case "activeUsers":
            items = await getTopActiveUsers(filter);
            chart = await generateChartData("activeUsers", filter);
            break;
          case "popularSubjects":
            items = await getTopPopularSubjects(filter);
            chart = await generateChartData("popularSubjects", filter);
            break;
          case "reportedUsers":
            items = await getTopReportedUsers(filter);
            chart = await generateChartData("reportedUsers", filter);
            break;
          case "popularPosts":
            items = await getTopPopularPosts(filter, postSortType);
            chart = await generateChartData("popularPosts", filter, postSortType);
            break;
        }

        const newCache = new Map(cache);
        newCache.set(cacheKey, { items, chart });
        onCacheUpdate(newCache);
      } catch (error) {
        console.error(`Error prefetching ${filter}:`, error);
      }
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
              <View style={{ 
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                minWidth: 60,
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Text style={{ 
                  color: theme.colors.onSecondaryContainer,
                  fontWeight: "600",
                  textAlign: "center"
                }}>
                  {user.value}
                </Text>
              </View>
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
            right={() => (
              <View style={{ 
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                minWidth: 50,
                justifyContent: "center",
                alignItems: "center"
              }}>
                <Text style={{ 
                  color: theme.colors.onSecondaryContainer,
                  fontWeight: "600",
                  textAlign: "center"
                }}>
                  {subject.value}
                </Text>
              </View>
            )}
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
              <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                <View style={{ 
                  backgroundColor: theme.colors.secondaryContainer,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  minWidth: 50,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 4
                }}>
                  <Text style={{ 
                    color: theme.colors.onSecondaryContainer,
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    {post.views}
                  </Text>
                </View>
                <View style={{ 
                  backgroundColor: theme.colors.secondaryContainer,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  minWidth: 50,
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  <Text style={{ 
                    color: theme.colors.onSecondaryContainer,
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    {post.likes}
                  </Text>
                </View>
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
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
              {title}
          </Text>
          <IconButton
              icon="close"
              onPress={onDismiss}
              size={20}
              style={[styles.closeButton, { right: -24, top: -24 }]}
              accessibilityLabel="Cerrar"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 0 }}>

          <Text variant="labelLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Período de tiempo
          </Text>
          <SegmentedButtons
            value={timeFilter}
            onValueChange={(value) => onTimeFilterChange(value as TimeFilter)}
            buttons={[
              {
                value: "today",
                label: "Hoy",
                style: { paddingVertical: 2, minWidth: 40 },
                labelStyle: { fontSize: 10, fontWeight: "400", lineHeight: 14 },
              },
              {
                value: "7days",
                label: "7d",
                style: { paddingVertical: 2, minWidth: 40 },
                labelStyle: { fontSize: 10, fontWeight: "400", lineHeight: 14 },
              },
              {
                value: "30days",
                label: "30d",
                style: { paddingVertical: 2, minWidth: 40 },
                labelStyle: { fontSize: 10, fontWeight: "400", lineHeight: 14 },
              },
              {
                value: "6months",
                label: "6m",
                style: { paddingVertical: 2, minWidth: 40 },
                labelStyle: { fontSize: 10, fontWeight: "400", lineHeight: 14 },
              },
              {
                value: "all",
                label: "Todo",
                style: { paddingVertical: 2, minWidth: 40 },
                labelStyle: { fontSize: 10, fontWeight: "400", lineHeight: 14 },
              },
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
                onValueChange={(value) => onPostSortTypeChange(value as PostSortType)}
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
                      xAxisLabelTextStyle={{ 
                        color: theme.colors.onSurfaceVariant, 
                        fontSize: 9,
                        transform: [{ rotate: '-35deg' }],
                        width: 60,
                        textAlign: 'right'
                      }}
                      curved
                      areaChart
                      hideDataPoints={chartData.length > 20}
                      dataPointsColor={theme.colors.primary}
                      dataPointsRadius={4}
                      showVerticalLines={false}
                      xAxisLabelsVerticalShift={10}
                      hideRules={chartData.length > 15}
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  closeButton: {
    position: 'absolute',
  },
  sectionTitle: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 0,
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
    paddingVertical: 5,
    paddingBottom: 0,
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