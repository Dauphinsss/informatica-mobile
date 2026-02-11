import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export default function SubjectsModalSkeleton() {
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
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((groupIndex) => (
        <View key={groupIndex} style={styles.accordionGroup}>
          {}
          <View style={styles.accordionHeader}>
            <Animated.View
              style={[
                styles.iconSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.titleSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.chevronSkeleton,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>

          {}
          {groupIndex === 1 && (
            <View style={styles.accordionContent}>
              {[1, 2, 3, 4, 5, 6].map((itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <Animated.View
                    style={[
                      styles.listItemText,
                      { backgroundColor: theme.colors.surfaceVariant, opacity },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.checkboxSkeleton,
                      { backgroundColor: theme.colors.surfaceVariant, opacity },
                    ]}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  accordionGroup: {
    marginBottom: 4,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  titleSkeleton: {
    flex: 1,
    height: 16,
    borderRadius: 4,
  },
  chevronSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginLeft: 8,
  },
  accordionContent: {
    paddingLeft: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemText: {
    flex: 1,
    height: 14,
    borderRadius: 4,
  },
  checkboxSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginLeft: 12,
  },
});
