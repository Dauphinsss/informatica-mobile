
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function NotificationItemSkeleton() {
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
    <View style={[styles.notifCard, { backgroundColor: theme.colors.elevation.level1 }]}>
      <View style={styles.notifItem}>
        {}
        <Animated.View
          style={[
            styles.icon,
            { backgroundColor: theme.colors.surfaceVariant, opacity },
          ]}
        />

        {}
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Animated.View
              style={[
                styles.title,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.time,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.description,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.descriptionShort,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export function NotificationSectionSkeleton() {
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
    <View style={styles.section}>
      {}
      <View style={styles.sectionHeader}>
        <Animated.View
          style={[
            styles.sectionTitle,
            { backgroundColor: theme.colors.surfaceVariant, opacity },
          ]}
        />
      </View>

      {}
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
      <NotificationItemSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    width: 80,
    height: 20,
    borderRadius: 4,
  },
  notifCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    width: "60%",
    height: 18,
    borderRadius: 4,
  },
  time: {
    width: 40,
    height: 14,
    borderRadius: 4,
  },
  description: {
    width: "90%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  descriptionShort: {
    width: "70%",
    height: 14,
    borderRadius: 4,
  },
  notifActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
