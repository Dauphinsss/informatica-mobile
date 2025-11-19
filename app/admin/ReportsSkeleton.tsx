// src/components/skeletons/ReportsSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ReportsSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const ReportsSkeleton: React.FC<ReportsSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useTheme();
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

// Skeleton para las tarjetas de reporte
export const ReportCardSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = getSkeletonStyles(theme);

  return (
    <View style={styles.cardSkeleton}>
      <ReportsSkeleton height={20} style={styles.titleSkeleton} />
      <ReportsSkeleton width="60%" height={12} style={styles.authorSkeleton} />
      <ReportsSkeleton width="20%" height={12} style={styles.dateSkeleton} />
      <View style={styles.chipContainerSkeleton}>
        <ReportsSkeleton width={"30%"} height={26} borderRadius={10} />
        <ReportsSkeleton width={"25%"} height={26} borderRadius={10} />
      </View>
    </View>
  );
};

// Skeleton para el modal de detalles
export const ReportDetailSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = getSkeletonStyles(theme);

  return (
    <View style={styles.detailContainer}>
      {/* Archivos adjuntos */}
        <View style={styles.archivosGridSkeleton}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.archivoSkeleton}>
              <ReportsSkeleton height={100} borderRadius={8} />
              <View style={styles.row}>
                <ReportsSkeleton width={16} height={16} borderRadius={16} />
                <ReportsSkeleton width="70%" height={16} />
              </View>
            </View>
          ))}
        </View>
      </View>
  );
};

// Skeleton para la lista de reportes en estado de carga
export const ReportsListSkeleton: React.FC = () => {
  const theme = useTheme();
  const styles = getSkeletonStyles(theme);

  return (
    <View style={styles.listContainer}>
            
      {/* Tarjetas skeleton */}
      {[1, 2, 3, 4].map((item) => (
        <ReportCardSkeleton key={item} />
      ))}
    </View>
  );
};

const getSkeletonStyles = (theme: any) => StyleSheet.create({
  cardSkeleton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 2,
    elevation: 2,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  authorSkeleton: {
    marginBottom: 4,
  },
  dateSkeleton: {
    marginBottom: 12,
  },
  chipContainerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  listContainer: {
    flex: 1,
  },
  filterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  detailContainer: {
    padding: 16,
  },
  detailTitle: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  publicationTitle: {
    marginBottom: 8,
  },
  publicationAuthor: {
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  archivosGridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  archivoSkeleton: {
    width: '45%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  archivoText: {
    marginTop: 8,
  },
  commentsHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsCount: {
    marginTop: 8,
    marginBottom: 4,
  },
  commentsHint: {
    marginTop: 4,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  denuncianteSkeleton: {
    paddingVertical: 12,
  },
  denuncianteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  denuncianteDesc: {
    marginLeft: 36,
  },
  actionsSkeleton: {
    marginTop: 16,
  },
  actionButtonSkeleton: {
    marginBottom: 12,
  },
});