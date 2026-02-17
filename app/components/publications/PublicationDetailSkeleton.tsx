import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Card, useTheme } from "react-native-paper";

const H_MARGIN = 16;
const FILE_PLACEHOLDER_COUNT = 6;

const SkeletonElement: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = "100%", height = 14, borderRadius = 6, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.45)).current;
  const theme = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.78,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

const HeaderSkeleton: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      style={[
        styles.headerCard,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
      elevation={2}
    >
      <Card.Content style={styles.headerContent}>
        <View style={styles.authorRow}>
          <SkeletonElement width={40} height={40} borderRadius={20} />
          <View style={styles.authorText}>
            <SkeletonElement width="72%" height={14} />
            <SkeletonElement width="48%" height={10} style={{ marginTop: 6 }} />
          </View>
        </View>

        <SkeletonElement
          height={1}
          borderRadius={1}
          style={{ opacity: 0.45, marginVertical: 2, width: "100%" }}
        />

        <SkeletonElement width="84%" height={22} borderRadius={7} />
        <SkeletonElement width="95%" height={15} style={{ marginTop: 8 }} />
        <SkeletonElement width="88%" height={15} style={{ marginTop: 4 }} />

        <View style={styles.statsRow}>
          <SkeletonElement width={110} height={30} borderRadius={15} />
          <View style={styles.statsRight}>
            <SkeletonElement width={34} height={12} borderRadius={6} />
            <SkeletonElement width={34} height={12} borderRadius={6} />
            <SkeletonElement width={34} height={12} borderRadius={6} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const FileRowSkeleton: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      style={[
        styles.fileCard,
        { backgroundColor: theme.colors.elevation.level1 },
      ]}
      elevation={2}
    >
      <View style={styles.fileRow}>
        <SkeletonElement width={48} height={48} borderRadius={12} />
        <View style={styles.fileMeta}>
          <SkeletonElement width="82%" height={14} />
          <SkeletonElement width="30%" height={11} style={{ marginTop: 5 }} />
        </View>
        <SkeletonElement width={20} height={20} borderRadius={10} />
      </View>
    </Card>
  );
};

export const PublicationDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <HeaderSkeleton />

      <View style={styles.filesContainer}>
        {Array.from({ length: FILE_PLACEHOLDER_COUNT }).map((_, idx) => (
          <FileRowSkeleton key={`file-skeleton-${idx}`} />
        ))}
      </View>

      <View style={{ height: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  headerCard: {
    marginHorizontal: "4%",
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  headerContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 10,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  filesContainer: {
    marginHorizontal: H_MARGIN,
    marginBottom: 8,
    gap: 8,
  },
  fileCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 10,
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
});
