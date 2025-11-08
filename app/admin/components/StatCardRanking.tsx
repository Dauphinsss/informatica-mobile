import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface StatCardRankingProps {
  title: string;
  topItemName: string;
  value: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
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
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name={icon}
              size={32}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text
              variant="bodyLarge"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              {title}
            </Text>

            <Text
              variant="titleLarge"
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

            <View style={styles.viewMoreContainer}>
              <Text
                variant="bodySmall"
                style={[styles.viewMoreText, { color: theme.colors.primary }]}
              >
                Ver detalles
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.primary}
              />
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
  },
  cardContent: {
    paddingVertical: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  contentContainer: {
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  topItemName: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 12,
  },
  value: {
    fontWeight: "bold",
  },
  valueLabel: {
    opacity: 0.8,
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  viewMoreText: {
    fontWeight: "600",
  },
});