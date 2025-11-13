import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import {
  eliminarNotificacionesUsuarioBatch,
  eliminarNotificacionUsuario,
  escucharNotificaciones,
  marcarComoLeida,
  NotificacionCompleta,
} from "@/services/notifications";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Menu,
  Portal,
  Text,
} from "react-native-paper";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const navigation = useNavigation<any>();
  const [notificaciones, setNotificaciones] = useState<NotificacionCompleta[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<{ id: string; titulo: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleNotificationPress = async (notif: NotificacionCompleta) => {
    // Marcar como leída
    if (!notif.leida) {
      try {
        await marcarComoLeida(notif.id);
      } catch (error) {
        console.error("Error al marcar como leída:", error);
      }
    }

    // Navegar según el tipo de notificación
    const metadata = notif.metadata;
    
    if (!metadata) {
      console.log('Notificación sin metadata, solo marcando como leída');
      return;
    }

    try {
      // Obtener la navegación del tab padre
      const tabNavigation = navigation.getParent() || navigation;

      switch (metadata.accion) {
        case 'ver_publicacion':
          if (metadata.materiaId && metadata.publicacionId) {
            console.log('[Notificación] Navegando a publicación:', metadata.publicacionId);
            tabNavigation.navigate('Home', {
              screen: 'PublicationDetail',
              params: {
                publicacionId: metadata.publicacionId,
                materiaNombre: metadata.materiaNombre || 'Publicación',
              },
            });
          }
          break;

        case 'ver_materia':
          if (metadata.materiaId) {
            console.log('[Notificación] Navegando a materia:', metadata.materiaId);
            tabNavigation.navigate('Home', {
              screen: 'SubjectDetail',
              params: {
                id: metadata.materiaId,
                materiaId: metadata.materiaId,
                nombre: metadata.materiaNombre || 'Materia',
              },
            });
          }
          break;

        case 'admin_decision':
          console.log('[Notificación] Decisión de admin, permaneciendo en notificaciones');
          // Ya estamos en la pantalla de notificaciones, no hacemos nada más
          break;

        default:
          console.log('[Notificación] Acción no reconocida:', metadata.accion);
          break;
      }
    } catch (error) {
      console.error('Error al navegar desde notificación:', error);
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
    setNotifToDelete({ id: notifUsuarioId, titulo });
    setDialogVisible(true);
  };

  const eliminarDirecto = async (notifUsuarioId: string) => {
    try {
      await eliminarNotificacionUsuario(notifUsuarioId);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const confirmarEliminacion = async () => {
    if (!notifToDelete) return;
    
    try {
      await eliminarNotificacionUsuario(notifToDelete.id);
      setDialogVisible(false);
      setNotifToDelete(null);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const renderRightActions = () => (
    <View style={[styles.swipeBackground, { backgroundColor: theme.colors.background }]} />
  );
  
  const renderLeftActions = () => (
    <View style={[styles.swipeBackground, { backgroundColor: theme.colors.background }]} />
  );

  const eliminarNotificacionesPorFecha = async (dias: number) => {
    setMenuVisible(false);
    setDeleting(true);
    
    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const notificacionesAEliminar = notificaciones.filter((notif) => {
      const fecha = notif.creadoEn?.toDate
        ? notif.creadoEn.toDate()
        : new Date(notif.creadoEn);
      return fecha < fechaLimite;
    });

    if (notificacionesAEliminar.length === 0) {
      setDeleting(false);
      return;
    }

    try {
      const ids = notificacionesAEliminar.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error("Error al eliminar notificaciones:", error);
    } finally {
      setDeleting(false);
    }
  };

  const eliminarNotificacionesDeHoy = async () => {
    setMenuVisible(false);
    setDeleting(true);
    
    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate()
    );

    const notificacionesAEliminar = notificaciones.filter((notif) => {
      const fecha = notif.creadoEn?.toDate
        ? notif.creadoEn.toDate()
        : new Date(notif.creadoEn);
      return fecha >= hoy;
    });

    if (notificacionesAEliminar.length === 0) {
      setDeleting(false);
      return;
    }

    try {
      const ids = notificacionesAEliminar.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error("Error al eliminar notificaciones de hoy:", error);
    } finally {
      setDeleting(false);
    }
  };

  const eliminarTodasLasNotificaciones = async () => {
    setMenuVisible(false);
    setDeleting(true);
    
    if (notificaciones.length === 0) {
      setDeleting(false);
      return;
    }

    try {
      const ids = notificaciones.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error("Error al eliminar todas las notificaciones:", error);
    } finally {
      setDeleting(false);
    }
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
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              disabled={deleting}
            />
          }
        >
          <Menu.Item
            onPress={eliminarNotificacionesDeHoy}
            title="Borrar de hoy"
            leadingIcon="clock-remove"
          />
          <Menu.Item
            onPress={() => eliminarNotificacionesPorFecha(7)}
            title="Borrar de +1 semana"
            leadingIcon="calendar-clock"
          />
          <Menu.Item
            onPress={() => eliminarNotificacionesPorFecha(30)}
            title="Borrar de +1 mes"
            leadingIcon="calendar-month"
          />
          <Divider />
          <Menu.Item
            onPress={eliminarTodasLasNotificaciones}
            title="Borrar todas"
            leadingIcon="delete-sweep"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
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
                  <ReanimatedSwipeable
                    key={notif.id}
                    renderRightActions={renderRightActions}
                    renderLeftActions={renderLeftActions}
                    overshootLeft={false}
                    overshootRight={false}
                    friction={1.5}
                    rightThreshold={60}
                    leftThreshold={60}
                    onSwipeableWillOpen={() => eliminarDirecto(notif.id)}
                  >
                    <Animated.View>
                      <TouchableOpacity
                        onPress={() => handleNotificationPress(notif)}
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
                        </View>
                      </TouchableOpacity>
                      <Divider
                        style={{ backgroundColor: theme.colors.outlineVariant }}
                      />
                    </Animated.View>
                  </ReanimatedSwipeable>
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

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Eliminar notificación
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Estás seguro de que deseas eliminar "{notifToDelete?.titulo}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogVisible(false)}
              textColor={theme.colors.onSurface}
            >
              Cancelar
            </Button>
            <Button
              onPress={confirmarEliminacion}
              textColor={theme.colors.error}
              mode="contained"
              buttonColor={theme.colors.errorContainer}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleting} dismissable={false}>
          <Dialog.Content style={{ alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyLarge" style={{ marginTop: 20, color: theme.colors.onSurface }}>
              Eliminando notificaciones...
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
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
  swipeBackground: {
    flex: 1,
    justifyContent: 'center',
  },
});
