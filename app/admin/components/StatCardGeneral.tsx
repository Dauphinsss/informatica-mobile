import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface StatCardGeneralProps {
  title: string;
  value: number;
  percentageChange: number;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
}

export default function StatCardGeneral({
  title,
  value,
  percentageChange,
  description,
  onPress,
}: StatCardGeneralProps) {
  const { theme } = useTheme();

  const isPositive = percentageChange >= 0;
  const changeColor = isPositive ? "#4caf50" : "#f44336";

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
              variant="displaySmall"
              style={[styles.value, { color: theme.colors.onSurface }]}
            >
              {formatNumber(value)}
            </Text>

            <View style={styles.changeContainer}>
              <View style={styles.percentageRow}>
                <MaterialCommunityIcons
                  name={isPositive ? "arrow-up" : "arrow-down"}
                  size={16}
                  color={changeColor}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.changeText, { color: changeColor }]}
                >
                  {isPositive ? "+" : ""}
                  {percentageChange}%
                </Text>
              </View>
              <Text
                variant="bodySmall"
                style={[styles.changeLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                vs últimos 30 días
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
    justifyContent: "center",
  },
  contentContainer: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    minHeight: 44,
    lineHeight: 22,
  },
  value: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  changeContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  percentageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  changeLabel: {
    fontSize: 11,
  },
});