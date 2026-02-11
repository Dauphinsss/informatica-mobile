import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

interface AdminBadgeProps {
  
  size: number;
  
  isAdmin?: boolean;
  
  role?: string | null;
  
  backgroundColor?: string;
  
  iconColor?: string;
}

export const isAdminRole = (role?: string | null): boolean => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  return (
    normalized === "admin" ||
    normalized === "administrador" ||
    normalized === "administrator"
  );
};


export function AdminBadge({
  size,
  isAdmin = false,
  role,
  backgroundColor,
  iconColor,
}: AdminBadgeProps) {
  const theme = useTheme();

  const showAsAdmin = isAdmin || isAdminRole(role);

  if (!showAsAdmin) return null;

  const iconSize = Math.max(12, size * 0.3);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: backgroundColor || theme.colors.background,
          borderRadius: iconSize,
          padding: 2,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="check-decagram"
        size={iconSize}
        color={iconColor || theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    zIndex: 10,
  },
});
