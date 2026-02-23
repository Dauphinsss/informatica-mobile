import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import { Text } from "react-native-paper";

export type SortOrder = "asc" | "desc";

export type SortOption<T extends string> = {
  key: T;
  label: string;
};

interface SortableChipsProps<T extends string> {
  sortBy: T;
  sortOrder: SortOrder;
  onFilterChange: (sortBy: T, sortOrder: SortOrder) => void;
  options: SortOption<T>[];
  theme: MD3Theme;
  showDirection?: boolean;
  toggleDirectionOnActive?: boolean;
}

export function SortableChips<T extends string>({
  sortBy,
  sortOrder,
  onFilterChange,
  options,
  theme,
  showDirection = true,
  toggleDirectionOnActive = true,
}: SortableChipsProps<T>) {
  const internalStyles = StyleSheet.create({
    container: {
      paddingBottom: 12,
      paddingHorizontal: 0,
    },
    scrollContent: {
      paddingHorizontal: 12,
      gap: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    chip: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: "center",
      alignItems: "center",
    },
    chipSelected: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: "center",
      alignItems: "center",
    },
    chipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.colors.onSurfaceVariant,
    },
    chipTextSelected: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onPrimaryContainer,
    },
  });

  const handleChipPress = (key: T) => {
    if (sortBy === key && toggleDirectionOnActive) {
      onFilterChange(key, sortOrder === "asc" ? "desc" : "asc");
      return;
    }
    onFilterChange(key, sortOrder);
  };

  const getChipLabel = (key: T) => {
    const option = options.find((o) => o.key === key);
    if (!option) return "";
    if (showDirection && sortBy === key) return `${option.label} ${sortOrder === "desc" ? "▼" : "▲"}`;
    return option.label;
  };

  return (
    <View style={internalStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={internalStyles.scrollContent}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => handleChipPress(option.key)}
            style={sortBy === option.key ? internalStyles.chipSelected : internalStyles.chip}
            activeOpacity={0.7}
          >
            <Text style={sortBy === option.key ? internalStyles.chipTextSelected : internalStyles.chipText}>
              {getChipLabel(option.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
