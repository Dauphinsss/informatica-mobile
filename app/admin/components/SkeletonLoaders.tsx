import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function CardSkeleton() {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View
        style={[
          styles.iconPlaceholder,
          { backgroundColor: theme.colors.surfaceVariant, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.titlePlaceholder,
          { backgroundColor: theme.colors.surfaceVariant, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.valuePlaceholder,
          { backgroundColor: theme.colors.surfaceVariant, opacity },
        ]}
      />
    </View>
  );
}

export function ChartSkeleton() {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.chartContainer}>
      <Animated.View
        style={[
          styles.chartTitlePlaceholder,
          { backgroundColor: theme.colors.surfaceVariant, opacity },
        ]}
      />
      <View style={styles.chartBars}>
        {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: theme.colors.surfaceVariant,
                opacity,
                height: Math.random() * 120 + 40,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Animated.View
            style={[
              styles.listIconPlaceholder,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />
          <View style={styles.listContent}>
            <Animated.View
              style={[
                styles.listTitlePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.listSubtitlePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.listValuePlaceholder,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    justifyContent: "space-between",
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  titlePlaceholder: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  valuePlaceholder: {
    width: "40%",
    height: 24,
    borderRadius: 4,
  },
  chartContainer: {
    padding: 16,
    marginTop: 16,
  },
  chartTitlePlaceholder: {
    width: "40%",
    height: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 180,
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 4,
  },
  listContainer: {
    padding: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  listIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
  listTitlePlaceholder: {
    width: "70%",
    height: 16,
    borderRadius: 4,
  },
  listSubtitlePlaceholder: {
    width: "50%",
    height: 12,
    borderRadius: 4,
  },
  listValuePlaceholder: {
    width: 50,
    height: 32,
    borderRadius: 8,
  },
});

export function ActivityListSkeleton({ count = 5 }: { count?: number }) {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={activityStyles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={activityStyles.item}>
          <Animated.View
            style={[
              activityStyles.iconPlaceholder,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />
          <View style={activityStyles.content}>
            <Animated.View
              style={[
                activityStyles.titlePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                activityStyles.subtitlePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                activityStyles.timePlaceholder,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const activityStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titlePlaceholder: {
    width: "85%",
    height: 16,
    borderRadius: 4,
  },
  subtitlePlaceholder: {
    width: "65%",
    height: 14,
    borderRadius: 4,
  },
  timePlaceholder: {
    width: "40%",
    height: 12,
    borderRadius: 4,
  },
});