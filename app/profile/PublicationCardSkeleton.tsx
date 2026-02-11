
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";

interface PublicationCardSkeletonProps {
  withHorizontalMargin?: boolean;
}

export default function PublicationCardSkeleton({
  withHorizontalMargin = true,
}: PublicationCardSkeletonProps) {
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
    <View
      style={[
        styles.card,
        { marginHorizontal: withHorizontalMargin ? 16 : 0 },
      ]}
    >
      <Card style={{ borderRadius: 16, backgroundColor: theme.colors.elevation.level1 }}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.topRow}>
            <Animated.View
              style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
            />
            <View style={styles.infoBlock}>
              <Animated.View
                style={[styles.titleLine, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
              />
              <Animated.View
                style={[styles.authorLine, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
              />
            </View>
            <Animated.View
              style={[styles.dateLine, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
            />
          </View>

          <Animated.View
            style={[styles.descriptionLine, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
          />

          <Animated.View
            style={[styles.subjectLine, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
          />

          <View style={styles.statsRow}>
            <Animated.View
              style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
            />
            <Animated.View
              style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
            />
            <Animated.View
              style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant, opacity }]}
            />
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardContent: {
    paddingVertical: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  infoBlock: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  titleLine: {
    width: "85%",
    height: 14,
    borderRadius: 4,
  },
  authorLine: {
    width: "65%",
    height: 11,
    borderRadius: 4,
  },
  dateLine: {
    width: 52,
    height: 10,
    borderRadius: 5,
  },
  descriptionLine: {
    width: "90%",
    height: 12,
    borderRadius: 6,
  },
  subjectLine: {
    width: "58%",
    height: 14,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  statPill: {
    width: 46,
    height: 12,
    borderRadius: 6,
  },
});
