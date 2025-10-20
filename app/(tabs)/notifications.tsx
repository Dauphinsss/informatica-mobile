import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import {
  eliminarNotificacionUsuario,
  escucharNotificaciones,
  marcarComoLeida,
  NotificacionCompleta,
} from "@/services/notifications";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Divider,
  IconButton,
  List,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [notificaciones, setNotificaciones] = useState<NotificacionCompleta[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = escucharNotificaciones(
      user.uid,
      (notifs) => {
        setNotificaciones(notifs);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar notificaciones:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const toggleExpand = async (notif: NotificacionCompleta) => {
    if (expandedId === notif.id) {
      setExpandedId(null);
    } else {
      setExpandedId(notif.id);
    }

    // Marcar como leída cuando se toca
    if (!notif.leida) {
      try {
        await marcarComoLeida(notif.id);
      } catch (error) {
        console.error("Error al marcar como leída:", error);
      }
    }
  };

  // Agrupar notificaciones por período (hoy, ayer, anteriores)
  const grupos = useMemo(() => {
    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const hoyNotifs: NotificacionCompleta[] = [];
    const ayerNotifs: NotificacionCompleta[] = [];
    const anterioresNotifs: NotificacionCompleta[] = [];

    notificaciones.forEach((notif) => {
      const fecha = notif.creadoEn?.toDate
        ? notif.creadoEn.toDate()
        : new Date(notif.creadoEn);

      if (fecha >= hoy) {
        hoyNotifs.push(notif);
      } else if (fecha >= ayer) {
        ayerNotifs.push(notif);
      } else {
        anterioresNotifs.push(notif);
      }
    });

    const result = [];
    if (hoyNotifs.length > 0)
      result.push({ key: "hoy", title: "Hoy", data: hoyNotifs });
    if (ayerNotifs.length > 0)
      result.push({ key: "ayer", title: "Ayer", data: ayerNotifs });
    if (anterioresNotifs.length > 0)
      result.push({
        key: "anteriores",
        title: "Anteriores",
        data: anterioresNotifs,
      });

    return result;
  }, [notificaciones]);

  const handleEliminarNotificacion = async (
    notifUsuarioId: string,
    titulo: string
  ) => {
    Alert.alert(
      "Eliminar notificación",
      `¿Estás seguro de que deseas eliminar "${titulo}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarNotificacionUsuario(notifUsuarioId);
            } catch (error) {
              console.error("Error al eliminar notificación:", error);
            }
          },
        },
      ]
    );
  };

  const getIconColor = (tipo: string, leida: boolean) => {
    if (leida) return theme.colors.outline;

    switch (tipo) {
      case "exito":
        return "#4caf50";
      case "advertencia":
        return "#ff9800";
      case "error":
        return "#f44336";
      default:
        return theme.colors.primary;
    }
  };

  const formatearTiempo = (timestamp: any) => {
    if (!timestamp) return "Ahora";

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return fecha.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Appbar.Header>
        <Appbar.Content title="Notificaciones" />
      </Appbar.Header>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>
            Cargando notificaciones...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {grupos.map((grupo) => (
            <View key={grupo.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {grupo.title}
                </Text>
              </View>
              <Divider />

              {grupo.data.map((notif) => {
                return (
                  <View key={notif.id}>
                    <TouchableOpacity
                      onPress={() => toggleExpand(notif)}
                      activeOpacity={0.7}
                      style={[
                        styles.notifItem,
                        {
                          backgroundColor: !notif.leida
                            ? theme.dark
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.03)"
                            : "transparent",
                        },
                      ]}
                    >
                      <List.Icon
                        icon={notif.icono}
                        color={getIconColor(notif.tipo, notif.leida)}
                        style={{ margin: 0 }}
                      />
                      <View style={styles.notifContent}>
                        <View style={styles.notifHeader}>
                          <Text
                            variant="bodyLarge"
                            style={[
                              styles.notifTitle,
                              {
                                color: theme.colors.onSurface,
                                fontWeight: !notif.leida ? "700" : "600",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {notif.titulo}
                          </Text>
                          <Text
                            variant="bodySmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              marginLeft: 8,
                            }}
                          >
                            {formatearTiempo(notif.creadoEn)}
                          </Text>
                        </View>
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.notifDescription,
                            {
                              color: theme.colors.onSurfaceVariant,
                              opacity: notif.leida ? 0.7 : 1,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {notif.descripcion}
                        </Text>
                      </View>
                      <View style={styles.notifActions}>
                        {!notif.leida && (
                          <View
                            style={[
                              styles.unreadDot,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          />
                        )}
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          iconColor={theme.colors.error}
                          style={{ margin: 0 }}
                          onPress={() =>
                            handleEliminarNotificacion(notif.id, notif.titulo)
                          }
                        />
                      </View>
                    </TouchableOpacity>
                    <Divider
                      style={{ backgroundColor: theme.colors.outlineVariant }}
                    />
                  </View>
                );
              })}
            </View>
          ))}

          {notificaciones.length === 0 && (
            <View style={styles.emptyState}>
              <IconButton
                icon="bell-outline"
                size={64}
                iconColor={theme.colors.outline}
              />
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, marginTop: 16 }}
              >
                No tienes notificaciones
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                Te notificaremos cuando haya algo nuevo
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold" as const,
  },

  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notifTitle: {
    fontWeight: "600",
    flex: 1,
  },
  notifDescription: {
    lineHeight: 20,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
});
