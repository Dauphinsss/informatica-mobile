import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityLog, ActivityIcon, ActivityType } from "@/scripts/types/Activity.type";
import { useTheme } from "@/contexts/ThemeContext";
import { AdminBadge, isAdminRole } from "@/components/ui/AdminBadge";

interface ActivityCardProps {
  activity: ActivityLog;
  onPress?: () => void;
}

const getActivityIcon = (tipo: ActivityType, theme: any): ActivityIcon => {
  switch (tipo) {
    case 'usuario_registrado':
      return {
        name: 'account-plus',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'publicacion_creada':
      return {
        name: 'file-document-plus',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'materia_creada':
      return {
        name: 'book-plus',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'publicacion_reportada':
      return {
        name: 'alert-circle',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'publicacion_eliminada':
      return {
        name: 'file-remove',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'publicacion_aprobada':
      return {
        name: 'check-circle',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'usuario_baneado':
      return {
        name: 'account-cancel',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    case 'usuario_desbaneado':
      return {
        name: 'account-check',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
    default:
      return {
        name: 'information',
        color: theme.colors.primary,
        backgroundColor: theme.colors.surfaceVariant,
      };
  }
};

const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp) return "Hace un momento";
  
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Hace un momento";
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

const shouldShowAvatar = (activity: ActivityLog): boolean => {
  if (
    activity.tipo === "usuario_registrado" ||
    activity.tipo === "publicacion_creada" ||
    activity.tipo === "publicacion_aprobada" ||
    activity.tipo === "publicacion_eliminada"
  ) {
    return true;
  }
  return false;
};

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { theme } = useTheme();
  const iconConfig = getActivityIcon(activity.tipo, theme);
  const timeAgo = formatTimeAgo(activity.timestamp);
  const showAvatar =
    shouldShowAvatar(activity) &&
    (!!activity.actorUid || !!activity.actorFoto || !!activity.actorNombre);
  const showAdminBadge = isAdminRole(activity.actorRol);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: "transparent",
        },
      ]}
    >
      <View style={styles.left}>
        {showAvatar ? (
          <View style={styles.avatarWrapper}>
            {activity.actorFoto ? (
              <Avatar.Image size={38} source={{ uri: activity.actorFoto }} />
            ) : (
              <Avatar.Text
                size={38}
                label={(activity.actorNombre || "U").charAt(0).toUpperCase()}
              />
            )}
            {showAdminBadge && (
              <AdminBadge
                size={38}
                role={activity.actorRol}
                backgroundColor={theme.colors.elevation.level1}
              />
            )}
          </View>
        ) : (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconConfig.backgroundColor }
            ]}
          >
            <MaterialCommunityIcons
              name={iconConfig.name as any}
              size={22}
              color={iconConfig.color}
            />
          </View>
        )}
      </View>

      <View style={styles.center}>
        <View style={styles.headerRow}>
          <Text
            variant="bodyLarge"
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            {activity.titulo}
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {timeAgo}
          </Text>
        </View>
        <Text
          variant="bodySmall"
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {activity.descripcion}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 10,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  left: {
    width: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: "600",
    fontSize: 14,
  },
  description: {
    lineHeight: 19,
    fontSize: 13,
  },
  avatarWrapper: {
    position: "relative",
  },
  iconContainer: {
    borderRadius: 8,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    minWidth: 10,
    textAlign: "right",
    opacity: 0.8,
  },
});
