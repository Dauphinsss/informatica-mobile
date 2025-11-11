import { CardSkeleton, ChartSkeleton, ListSkeleton } from "@/app/admin/components/SkeletonLoaders";
import { useTheme } from "@/contexts/ThemeContext";
import { ChartDataPoint, PostSortType, TimeFilter } from "@/scripts/types/Statistics.type";
import {
    generateChartData,
    getRankingStats,
    getTopActiveUsers,
    getTopPopularPosts,
    getTopPopularSubjects,
    getTopReportedUsers,
} from "@/services/statistics.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Button, Card, Divider, List, SegmentedButtons, Text } from "react-native-paper";
import StatCardRanking from "../components/StatCardRanking";
import { useStatistics } from "../contexts/StatisticsContext";
import { getStyles } from "../statistics.styles";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RankingSection = 'activeUsers' | 'popularSubjects' | 'reportedUsers' | 'popularPosts';

interface SectionState {
  loading: boolean;
  data: {
    items: any[];
    chart: ChartDataPoint[];
  } | null;
  expanded: boolean;
  timeFilter: TimeFilter;
  postSortType?: PostSortType;
}

export default function RankingScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<RankingSection, number>>({
    activeUsers: 0,
    popularSubjects: 0,
    reportedUsers: 0,
    popularPosts: 0,
  });

  const {
    rankingStats,
    setRankingStats,
    rankingLoading,
    setRankingLoading,
  } = useStatistics();

  const [sections, setSections] = useState<Record<RankingSection, SectionState>>({
    activeUsers: { loading: false, data: null, expanded: false, timeFilter: '30days' },
    popularSubjects: { loading: false, data: null, expanded: false, timeFilter: '30days' },
    reportedUsers: { loading: false, data: null, expanded: false, timeFilter: '30days' },
    popularPosts: { loading: false, data: null, expanded: false, timeFilter: '30days', postSortType: 'views' },
  });

  useEffect(() => {
    if (!rankingStats && rankingLoading) {
      loadRankingStats();
    }
  }, [rankingLoading]);

  useEffect(() => {
    if (rankingStats && !sections.activeUsers.data) {
      loadSectionsSequentially();
    }
  }, [rankingStats]);

  const loadRankingStats = async () => {
    try {
      const rankings = await getRankingStats();
      setRankingStats(rankings);
    } catch (err) {
      console.error("Error cargando Rankings:", err);
    } finally {
      setRankingLoading(false);
    }
  };

  const loadSectionsSequentially = async () => {
    await Promise.all([
      loadSection('activeUsers'),
      loadSection('popularSubjects'),
      loadSection('reportedUsers'),
      loadSection('popularPosts'),
    ]);
  };

  const loadSection = async (section: RankingSection) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], loading: true },
    }));

    try {
      const timeFilter = sections[section].timeFilter;
      let items: any[] = [];
      let chart: ChartDataPoint[] = [];

      switch (section) {
        case 'activeUsers':
          items = await getTopActiveUsers(timeFilter);
          chart = await generateChartData('activeUsers', timeFilter);
          break;
        case 'popularSubjects':
          items = await getTopPopularSubjects(timeFilter);
          chart = await generateChartData('popularSubjects', timeFilter);
          break;
        case 'reportedUsers':
          items = await getTopReportedUsers(timeFilter);
          chart = await generateChartData('reportedUsers', timeFilter);
          break;
        case 'popularPosts':
          const sortType = sections[section].postSortType || 'views';
          items = await getTopPopularPosts(timeFilter, sortType);
          chart = await generateChartData('popularPosts', timeFilter, sortType);
          break;
      }

      setSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          loading: false,
          data: { items, chart },
        },
      }));
    } catch (err) {
      console.error(`Error cargando sección ${section}:`, err);
      setSections(prev => ({
        ...prev,
        [section]: { ...prev[section], loading: false },
      }));
    }
  };

  const handleCardPress = (section: RankingSection) => {
    const position = sectionPositions.current[section];
    if (position > 0 && sections[section].data) {
      scrollViewRef.current?.scrollTo({ y: position - 80, animated: true });
    }
  };

  const handleSectionLayout = (section: RankingSection, event: any) => {
    const { y } = event.nativeEvent.layout;
    sectionPositions.current[section] = y;
  };

  const handleTimeFilterChange = (section: RankingSection, filter: TimeFilter) => {
    const currentSortType = section === 'popularPosts' ? sections[section].postSortType || 'views' : undefined;
    
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], timeFilter: filter, loading: true },
    }));

    loadSectionWithFilter(section, filter, currentSortType);
  };

  const loadSectionWithFilter = async (section: RankingSection, filter: TimeFilter, sortType?: PostSortType) => {
    try {
      let items: any[] = [];
      let chart: ChartDataPoint[] = [];

      switch (section) {
        case 'activeUsers':
          items = await getTopActiveUsers(filter);
          chart = await generateChartData('activeUsers', filter);
          break;
        case 'popularSubjects':
          items = await getTopPopularSubjects(filter);
          chart = await generateChartData('popularSubjects', filter);
          break;
        case 'reportedUsers':
          items = await getTopReportedUsers(filter);
          chart = await generateChartData('reportedUsers', filter);
          break;
        case 'popularPosts':
          const postSort = sortType || 'views';
          items = await getTopPopularPosts(filter, postSort);
          chart = await generateChartData('popularPosts', filter, postSort);
          break;
      }

      setSections(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          loading: false,
          data: { items, chart },
        },
      }));
    } catch (err) {
      console.error(`Error cargando sección ${section}:`, err);
      setSections(prev => ({
        ...prev,
        [section]: { ...prev[section], loading: false },
      }));
    }
  };

  const handlePostSortChange = (sortType: PostSortType) => {
    const currentFilter = sections.popularPosts.timeFilter;
    
    setSections(prev => ({
      ...prev,
      popularPosts: { ...prev.popularPosts, postSortType: sortType, loading: true },
    }));
    loadSectionWithPostSort(currentFilter, sortType);
  };

  const loadSectionWithPostSort = async (filter: TimeFilter, sortType: PostSortType) => {
    try {
      const items = await getTopPopularPosts(filter, sortType);
      const chart = await generateChartData('popularPosts', filter, sortType);

      setSections(prev => ({
        ...prev,
        popularPosts: {
          ...prev.popularPosts,
          loading: false,
          data: { items, chart },
        },
      }));
    } catch (err) {
      console.error('Error cargando popularPosts:', err);
      setSections(prev => ({
        ...prev,
        popularPosts: { ...prev.popularPosts, loading: false },
      }));
    }
  };

  const toggleExpanded = (section: RankingSection) => {
    setSections(prev => ({
      ...prev,
      [section]: { ...prev[section], expanded: !prev[section].expanded },
    }));
  };

  const renderTopList = (section: RankingSection) => {
    const sectionData = sections[section];
    if (!sectionData.data) return null;

    const items = sectionData.data.items;
    const displayItems = sectionData.expanded ? items.slice(0, 10) : items.slice(0, 3);
    const hasMore = items.length > 3 && !sectionData.expanded;

    return (
      <View>
        {displayItems.map((item, index) => {
          let valueNumber: number | string = (item as any).value ?? (item as any).views ?? (item as any).likes ?? 0;
          let labelText = getSectionLabel(section);

          if (section === 'popularPosts') {
            const sortType = sections.popularPosts.postSortType || 'views';
            if (sortType === 'views') {
              valueNumber = (item as any).views ?? (item as any).value ?? 0;
            } else {
              valueNumber = (item as any).likes ?? (item as any).value ?? 0;
            }
            labelText = sortType === 'views' ? 'vistas' : 'likes';
          }

          return (
            <React.Fragment key={index}>
              <List.Item
                title={item.nombre || item.titulo || 'Sin nombre'}
                description={`${valueNumber} ${labelText}`}
                left={() => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                    <Text variant="titleMedium" style={{ 
                      color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.colors.onSurfaceVariant,
                      fontWeight: 'bold',
                      width: 20,
                    }}>
                      {index + 1}
                    </Text>
                  </View>
                )}
              />
              {index < displayItems.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
        {hasMore && (
          <Button
            mode="text"
            onPress={() => toggleExpanded(section)}
            style={{ marginTop: 8 }}
          >
            Ver más (top 10)
          </Button>
        )}
        {sectionData.expanded && items.length > 3 && (
          <Button
            mode="text"
            onPress={() => toggleExpanded(section)}
            style={{ marginTop: 8 }}
          >
            Ver menos
          </Button>
        )}
      </View>
    );
  };

  const getSectionLabel = (section: RankingSection): string => {
    switch (section) {
      case 'activeUsers':
        return 'publicaciones';
      case 'popularSubjects':
        return 'publicaciones';
      case 'reportedUsers':
        return 'reportes';
      case 'popularPosts':
        const sortType = sections[section]?.postSortType || 'views';
        return sortType === 'views' ? 'vistas' : 'likes';
    }
  };

  const getSectionTitle = (section: RankingSection): string => {
    switch (section) {
      case 'activeUsers':
        return 'Usuario Más Activo';
      case 'popularSubjects':
        return 'Materia Más Popular';
      case 'reportedUsers':
        return 'Usuario Más Reportado';
      case 'popularPosts':
        return 'Publicación Más Popular';
    }
  };

  const getSectionIcon = (section: RankingSection): string => {
    switch (section) {
      case 'activeUsers':
        return 'account-star';
      case 'popularSubjects':
        return 'fire';
      case 'reportedUsers':
        return 'alert-octagon';
      case 'popularPosts':
        return 'trending-up';
    }
  };

  if (rankingLoading && !rankingStats) {
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {rankingStats && (
          <>
            <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 12 }]}>
              Vista Rápida
            </Text>
            <View style={styles.cardsGrid}>
              <View style={styles.cardHalf}>
                {rankingStats.mostActiveUser ? (
                  <StatCardRanking
                    title="Usuario Más Activo"
                    topItemName={rankingStats.mostActiveUser.nombre}
                    value={rankingStats.mostActiveUser.value}
                    valueLabel="publicaciones"
                    icon="account-star"
                    onPress={() => handleCardPress('activeUsers')}
                  />
                ) : (
                  <Card style={{ padding: 16 }}>
                    <Text>Sin datos</Text>
                  </Card>
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
                    onPress={() => handleCardPress('popularSubjects')}
                  />
                ) : (
                  <Card style={{ padding: 16 }}>
                    <Text>Sin datos</Text>
                  </Card>
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
                    onPress={() => handleCardPress('reportedUsers')}
                  />
                ) : (
                  <Card style={{ padding: 16 }}>
                    <Text>Sin datos</Text>
                  </Card>
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
                    onPress={() => handleCardPress('popularPosts')}
                  />
                ) : (
                  <Card style={{ padding: 16 }}>
                    <Text>Sin datos</Text>
                  </Card>
                )}
              </View>
            </View>

            <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Análisis Detallado
            </Text>

            {(['activeUsers', 'popularSubjects', 'reportedUsers', 'popularPosts'] as RankingSection[]).map((section) => (
              <View
                key={section}
                onLayout={(event) => handleSectionLayout(section, event)}
                style={{ marginBottom: 32 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <MaterialCommunityIcons
                    name={getSectionIcon(section) as any}
                    size={24}
                    color={theme.colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text variant="titleMedium" style={{ flex: 1 }}>
                    {getSectionTitle(section)}
                  </Text>
                </View>

                {sections[section].loading ? (
                  <View>
                    <ChartSkeleton />
                    <View style={{ marginTop: 16 }}>
                      <ListSkeleton count={3} />
                    </View>
                  </View>
                ) : sections[section].data ? (
                  <View>
                    <View style={{ marginBottom: 16 }}>
                      <Text variant="labelSmall" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                        Período de tiempo
                      </Text>
                      <SegmentedButtons
                        value={sections[section].timeFilter}
                        onValueChange={(value) => handleTimeFilterChange(section, value as TimeFilter)}
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
                        density="small"
                      />
                    </View>

                    {section === 'popularPosts' && (
                      <View style={{ marginBottom: 16 }}>
                        <Text variant="labelSmall" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                          Ordenar por
                        </Text>
                        <SegmentedButtons
                          value={sections[section].postSortType || 'views'}
                          onValueChange={(value) => handlePostSortChange(value as PostSortType)}
                          buttons={[
                            { value: 'views', label: 'Vistas', icon: 'eye' },
                            { value: 'likes', label: 'Likes', icon: 'thumb-up' },
                          ]}
                        />
                      </View>
                    )}

                    {sections[section].data && sections[section].data!.chart.length > 0 && (
                      <View style={{ marginBottom: 16, marginHorizontal: -16 }}>
                        <Text variant="labelLarge" style={{ marginBottom: 12, marginHorizontal: 16, color: theme.colors.onSurface }}>
                          Tendencia
                        </Text>
                        <View style={{ paddingLeft: 8 }}>
                          <LineChart
                            data={sections[section].data!.chart}
                            width={SCREEN_WIDTH - 32}
                            height={220}
                            color={theme.colors.primary}
                            thickness={3}
                            startFillColor={theme.colors.primary}
                            endFillColor={theme.colors.background}
                            startOpacity={0.4}
                            endOpacity={0.1}
                            initialSpacing={0}
                            spacing={sections[section].data!.chart.length > 10 ? 30 : 50}
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
                            hideDataPoints={sections[section].data!.chart.length > 20}
                            dataPointsColor={theme.colors.primary}
                            dataPointsRadius={4}
                            showVerticalLines={false}
                            xAxisLabelsVerticalShift={10}
                            hideRules={sections[section].data!.chart.length > 15}
                          />
                        </View>
                      </View>
                    )}

                    <Card style={{ padding: 16 }}>
                      <Text variant="titleSmall" style={{ marginBottom: 12 }}>
                        Top Rankings
                      </Text>
                      {renderTopList(section)}
                    </Card>
                  </View>
                ) : (
                  <Card style={{ padding: 24, alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name="database-off"
                      size={48}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text style={{ marginTop: 12 }}>No hay datos disponibles</Text>
                  </Card>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}