
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
      <Card
        style={{
          backgroundColor: theme.colors.elevation.level1,
          elevation: 1,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <Card.Content>
          <View style={styles.wrapper}>
            <View style={styles.topRow}>
              <Animated.View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.surfaceVariant, opacity },
                ]}
              />
              <View style={styles.infoBlock}>
                <Animated.View
                  style={[
                    styles.titleLine,
                    { backgroundColor: theme.colors.surfaceVariant, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.authorLine,
                    { backgroundColor: theme.colors.surfaceVariant, opacity },
                  ]}
                />
              </View>
            </View>

            <Animated.View
              style={[
                styles.descriptionLine,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.descriptionLineShort,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />

            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant, opacity: 0.5 },
              ]}
            />

            <View style={styles.statsRow}>
              <View style={styles.statsLeft}>
                <Animated.View
                  style={[
                    styles.statItem,
                    { backgroundColor: theme.colors.surfaceVariant, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.statItem,
                    { backgroundColor: theme.colors.surfaceVariant, opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.statItem,
                    { backgroundColor: theme.colors.surfaceVariant, opacity },
                  ]}
                />
              </View>
              <Animated.View
                style={[
                  styles.dateLine,
                  { backgroundColor: theme.colors.surfaceVariant, opacity },
                ]}
              />
            </View>
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
  wrapper: {
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
    minWidth: 0,
    gap: 6,
  },
  titleLine: {
    width: "92%",
    height: 20,
    borderRadius: 4,
  },
  authorLine: {
    width: "58%",
    height: 14,
    borderRadius: 4,
  },
  descriptionLine: {
    width: "96%",
    height: 15,
    borderRadius: 4,
  },
  descriptionLineShort: {
    width: "76%",
    height: 15,
    borderRadius: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dateLine: {
    width: 82,
    height: 13,
    borderRadius: 5,
  },
  statItem: {
    width: 42,
    height: 14,
    borderRadius: 6,
  },
});
