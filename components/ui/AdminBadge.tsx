import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

interface AdminBadgeProps {
  /** Tamaño del avatar al que se le añade el badge */
  size: number;
  /** Si es true, muestra el badge de admin */
  isAdmin?: boolean;
  /** Rol crudo del usuario para normalizar variantes (admin/administrador) */
  role?: string | null;
  /** Fondo del badge para integrarlo con la card */
  backgroundColor?: string;
  /** Color del ícono */
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

/**
 * Badge sutil de admin para superponer sobre un Avatar.
 * Muestra un pequeño icono de escudo en la esquina inferior derecha.
 *
 * Uso: envolver el Avatar en un View con position relative y colocar
 * <AdminBadge> como hermano después del Avatar.
 *
 * O usar el wrapper <AvatarWithBadge> para simplificar.
 */
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
