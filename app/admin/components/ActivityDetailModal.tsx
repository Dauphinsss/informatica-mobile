import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Portal, Modal, Text, IconButton, Divider, Chip } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { ActivityLog, ActivityType } from "@/scripts/types/Activity.type";

interface ActivityDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  activity: ActivityLog | null;
}

const getActivityIcon = (tipo: ActivityType, theme: any) => {
  switch (tipo) {
    case 'usuario_registrado':
      return { name: 'account-plus', color: theme.colors.surfaceVariant };
    case 'publicacion_creada':
      return { name: 'file-document-plus', color: theme.colors.surfaceVariant };
    case 'materia_creada':
      return { name: 'book-plus', color: theme.colors.surfaceVariant };
    case 'publicacion_reportada':
      return { name: 'alert-circle', color: theme.colors.surfaceVariant };
    case 'publicacion_eliminada':
      return { name: 'file-remove', color: theme.colors.surfaceVariant };
    case 'usuario_baneado':
      return { name: 'account-cancel', color: theme.colors.surfaceVariant };
    case 'usuario_desbaneado':
      return { name: 'account-check', color: theme.colors.surfaceVariant };
    case 'publicacion_aprobada':
      return { name: 'check-circle', color: theme.colors.surfaceVariant };
    default:
      return { name: 'information', color: theme.colors.onSurfaceVariant };
  }
};

const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return 'Fecha desconocida';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ActivityDetailModal({
  visible,
  onDismiss,
  activity,
}: ActivityDetailModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!activity) return null;

  const iconConfig = getActivityIcon(activity.tipo, theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <MaterialCommunityIcons
                name={iconConfig.name as any}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Detalle de Actividad
            </Text>
          </View>
          <IconButton
            icon="close"
            onPress={onDismiss}
            size={20}
            style={styles.closeButton}
          />
        </View>

        <Divider style={styles.divider} />

        <View style={styles.content}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {activity.titulo}
          </Text>

          <Text
            variant="bodyMedium"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {activity.descripcion}
          </Text>

          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                {formatTimestamp(activity.timestamp)}
              </Text>
            </View>

            {activity.actorNombre && (
              <View style={styles.metadataRow}>
                <MaterialCommunityIcons
                  name="account"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}>
                  Por: {activity.actorNombre}
                </Text>
              </View>
            )}

            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <View style={styles.metadataSection}>
                <Text variant="labelMedium" style={[styles.metadataLabel, { color: theme.colors.onSurface }]}>
                  Información adicional:
                </Text>
                {Object.entries(activity.metadata).map(([key, value]) => (
                  value && (
                    <Chip
                      key={key}
                      mode="outlined"
                      style={styles.chip}
                      textStyle={{ fontSize: 12 }}
                    >
                      {`${key}: ${value}`}
                    </Chip>
                  )
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    marginHorizontal: 20,
    marginVertical: 60,
    borderRadius: 16,
    padding: 0,
    maxHeight: "80%",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  divider: {
    marginHorizontal: 20,
  },
  content: {
    padding: 20,
  },
  title: {
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    marginBottom: 20,
    lineHeight: 22,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataSection: {
    marginTop: 8,
    gap: 8,
  },
  metadataLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});