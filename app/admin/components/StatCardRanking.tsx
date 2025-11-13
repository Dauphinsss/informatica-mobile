import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { useTheme } from "@/contexts/ThemeContext";

interface StatCardRankingProps {
  title: string;
  topItemName: string;
  value: number;
  icon?: string;
  valueLabel: string;
  onPress: () => void;
}

export default function StatCardRanking({
  title,
  topItemName,
  value,
  icon,
  valueLabel,
  onPress,
}: StatCardRankingProps) {
  const { theme } = useTheme();

  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-ES");
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card elevation={2} style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.contentContainer}>
            <Text
              variant="bodyLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {title}
            </Text>

            <Text
              variant="titleMedium"
              style={[styles.topItemName, { color: theme.colors.primary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {topItemName}
            </Text>

            <View style={styles.valueContainer}>
              <Text
                variant="displaySmall"
                style={[styles.value, { color: theme.colors.onSurface }]}
              >
                {formatNumber(value)}
              </Text>
              <Text
                variant="bodyMedium"
                style={[styles.valueLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                {valueLabel}
              </Text>
            </View>

          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    flex: 1,
    minHeight: 160,
  },
  cardContent: {
    paddingVertical: 20,
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    minHeight: 44,
    lineHeight: 22,
  },
  topItemName: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 8,
    minHeight: 44,
  },
  valueContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
  },
  value: {
    fontWeight: "bold",
  },
  valueLabel: {
    opacity: 0.8,
    marginTop: 4,
  },
});