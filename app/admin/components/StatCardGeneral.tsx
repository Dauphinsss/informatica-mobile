import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface StatCardGeneralProps {
  title: string;
  value: number;
  percentageChange: number;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function StatCardGeneral({
  title,
  value,
  percentageChange,
  description,
  icon,
}: StatCardGeneralProps) {
  const { theme } = useTheme();

  const isPositive = percentageChange >= 0;
  const changeColor = isPositive ? "#4caf50" : "#f44336";

  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-ES");
  };

  return (
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
            variant="displaySmall"
            style={[styles.value, { color: theme.colors.onSurface }]}
          >
            {formatNumber(value)}
          </Text>

          <View style={styles.changeContainer}>
            <MaterialCommunityIcons
              name={isPositive ? "arrow-up" : "arrow-down"}
              size={20}
              color={changeColor}
            />
            <Text
              variant="bodyMedium"
              style={[styles.changeText, { color: changeColor }]}
            >
              {isPositive ? "+" : ""}
              {percentageChange}%
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.changeLabel, { color: theme.colors.onSurfaceVariant }]}
            >
              vs últimos 30 días
            </Text>
          </View>

          <Text
            variant="bodySmall"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {description}
          </Text>
        </View>
      </Card.Content>
    </Card>
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
  },
  value: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  changeText: {
    fontWeight: "bold",
  },
  changeLabel: {
    marginLeft: 4,
  },
  description: {
    textAlign: "center",
    marginTop: 4,
    opacity: 0.8,
  },
});