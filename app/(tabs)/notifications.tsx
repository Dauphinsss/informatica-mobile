import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import {
  eliminarNotificacionUsuario,
  escucharNotificaciones,
  marcarComoLeida,
  NotificacionCompleta
} from "@/services/notifications";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Badge, Card, Divider, IconButton, List, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [notificaciones, setNotificaciones] = useState<NotificacionCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = escucharNotificaciones(
      user.uid,
      (notifs) => {
        setNotificaciones(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar notificaciones:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleMarcarLeida = async (notifUsuarioId: string) => {
    try {
      await marcarComoLeida(notifUsuarioId);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleEliminarNotificacion = async (notifUsuarioId: string, titulo: string) => {
    Alert.alert(
      'Eliminar notificación',
      `¿Estás seguro de que deseas eliminar "${titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarNotificacionUsuario(notifUsuarioId);
            } catch (error) {
              console.error('Error al eliminar notificación:', error);
            }
          },
        },
      ]
    );
  };

  const getIconColor = (tipo: string, leida: boolean) => {
    if (leida) return theme.colors.outline;
    
    switch (tipo) {
      case 'exito':
        return '#4caf50';
      case 'advertencia':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return theme.colors.primary;
    }
  };

  const formatearTiempo = (timestamp: any) => {
    if (!timestamp) return 'Ahora';
    
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return fecha.toLocaleDateString();
  };

  if (!user) return null;

  const noLeidas = notificaciones.filter(n => !n.leida);
  const leidas = notificaciones.filter(n => n.leida);

  return (
    <View
      style={[styles.container, { 
        backgroundColor: theme.colors.background,
        paddingBottom: insets.bottom 
      }]}
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
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Notificaciones No Leídas */}
          {noLeidas.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    No leídas
                  </Text>
                  <Badge style={{ backgroundColor: theme.colors.primary }}>
                    {noLeidas.length}
                  </Badge>
                </View>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              </Card.Content>
              {noLeidas.map((notif) => (
                <TouchableOpacity 
                  key={notif.id}
                  onPress={() => handleMarcarLeida(notif.id)}
                  style={[styles.notifItem, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <List.Item
                    title={notif.titulo}
                    description={notif.descripcion}
                    titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                    left={(props) => (
                      <List.Icon 
                        {...props} 
                        icon={notif.icono}
                        color={getIconColor(notif.tipo, notif.leida)}
                      />
                    )}
                    right={(props) => (
                      <View style={styles.rightContent}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {formatearTiempo(notif.creadoEn)}
                        </Text>
                        <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
                        <IconButton
                          icon="delete-outline"
                          size={20}
                          iconColor={theme.colors.error}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEliminarNotificacion(notif.id, notif.titulo);
                          }}
                        />
                      </View>
                    )}
                  />
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Notificaciones Leídas */}
          {leidas.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Leídas
                </Text>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
              </Card.Content>
              {leidas.map((notif) => (
                <List.Item
                  key={notif.id}
                  title={notif.titulo}
                  description={notif.descripcion}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  left={(props) => (
                    <List.Icon 
                      {...props} 
                      icon={notif.icono} 
                      color={getIconColor(notif.tipo, notif.leida)}
                    />
                  )}
                  right={(props) => (
                    <View style={styles.rightContent}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatearTiempo(notif.creadoEn)}
                      </Text>
                      <IconButton
                        icon="delete-outline"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleEliminarNotificacion(notif.id, notif.titulo)}
                      />
                    </View>
                  )}
                />
              ))}
            </Card>
          )}

          {/* Sin notificaciones */}
          {notificaciones.length === 0 && (
            <View style={styles.emptyState}>
              <IconButton icon="bell-outline" size={64} iconColor={theme.colors.outline} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginTop: 16 }}>
                No tienes notificaciones
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: "bold" as const,
  },
  divider: {
    marginVertical: 8,
  },
  notifItem: {
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
});
