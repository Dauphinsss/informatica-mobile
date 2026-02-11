import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";

export default function SubjectCardSkeleton() {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
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
    );

    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Card style={[styles.card, { backgroundColor: 'transparent', shadowColor: 'transparent' }]} elevation={2}>
      <View style={styles.cardHeader}>
        <Animated.View
          style={[
            styles.headerBackground,
                { backgroundColor: theme.colors.surface, opacity },
          ]}
        />
        <View style={styles.cardHeaderContent}>
          <View style={styles.cardBadgeRow}>
            <Animated.View
              style={[
                styles.badgeSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
          <View style={styles.cardTitleBlock}>
            <Animated.View
              style={[
                styles.titleSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.subtitleSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardHeader: {
    position: "relative",
    overflow: "hidden",
    aspectRatio: 21 / 9,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeaderContent: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    bottom: 12,
    justifyContent: "space-between",
    gap: 12,
  },
  cardBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  badgeSkeleton: {
    width: 100,
    height: 20,
    borderRadius: 999,
  },
  cardTitleBlock: {
    gap: 8,
  },
  titleSkeleton: {
    width: "80%",
    height: 24,
    borderRadius: 4,
  },
  subtitleSkeleton: {
    width: "50%",
    height: 16,
    borderRadius: 4,
  },
});
