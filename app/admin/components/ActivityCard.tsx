import React from "react";
import { View, StyleSheet } from "react-native";
import { List, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityLog, ActivityIcon, ActivityType } from "@/scripts/types/Activity.type";
import { useTheme } from "@/contexts/ThemeContext";

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
  if (!timestamp) return 'Hace un momento';
  
  const now = new Date();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Hace un momento';
  if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export default function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const { theme } = useTheme();
  const iconConfig = getActivityIcon(activity.tipo, theme);
  const timeAgo = formatTimeAgo(activity.timestamp);

  return (
    <List.Item
      title={activity.titulo}
      description={activity.descripcion}
      left={() => (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconConfig.backgroundColor }
          ]}
        >
          <MaterialCommunityIcons
            name={iconConfig.name as any}
            size={24}
            color={iconConfig.color}
          />
        </View>
      )}
      right={() => (
        <Text
          variant="bodySmall"
          style={[styles.timeText, { color: theme.colors.onSurfaceVariant }]}
        >
          {timeAgo}
        </Text>
      )}
      onPress={onPress}
      titleNumberOfLines={1}
      descriptionNumberOfLines={2}
    />
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  timeText: {
    alignSelf: 'center',
    fontSize: 11,
  },
});