// src/screens/notifications/NotificationsScreen.tsx
import { NotificationSectionSkeleton } from "@/app/(tabs)/components/NotificationItemSkeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import {
  eliminarNotificacionesUsuarioBatch,
  eliminarNotificacionUsuario,
  escucharNotificaciones,
  marcarComoLeida,
  NotificacionCompleta,
} from "@/services/notifications";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Snackbar,
  Text,
  TouchableRipple,
} from "react-native-paper";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const navigation = useNavigation<any>();
  const [notificaciones, setNotificaciones] = useState<NotificacionCompleta[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<{
    id: string;
    titulo: string;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const pendingDeletesRef = React.useRef(new Set<string>());

  useEffect(() => {
    if (!user) return;

    const unsubscribe = escucharNotificaciones(
      user.uid,
      (notifs) => {
        const filtradas = notifs.filter(
          (n) => !pendingDeletesRef.current.has(n.id),
        );
        setNotificaciones(filtradas);
        setTimeout(() => setLoading(false), 300);
      },
      (error) => {
        console.error("Error al cargar notificaciones:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
      pendingDeletesRef.current.clear();
    };
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setMenuVisible(false);
      };
    }, []),
  );

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
      console.log("Notificación sin metadata, solo marcando como leída");
      return;
    }

    try {
      // Obtener la navegación del tab padre
      const tabNavigation = navigation.getParent() || navigation;

      switch (metadata.accion) {
        case "ver_publicacion":
          if (metadata.materiaId && metadata.publicacionId) {
            console.log(
              "[Notificación] Navegando a publicación:",
              metadata.publicacionId,
            );
            tabNavigation.navigate("Home", {
              screen: "PublicationDetail",
              params: {
                publicacionId: metadata.publicacionId,
                materiaNombre: metadata.materiaNombre || "Publicación",
              },
            });
          }
          break;

        case "ver_materia":
          if (metadata.materiaId) {
            console.log(
              "[Notificación] Navegando a materia:",
              metadata.materiaId,
            );
            tabNavigation.navigate("Home", {
              screen: "SubjectDetail",
              params: {
                id: metadata.materiaId,
                materiaId: metadata.materiaId,
                nombre: metadata.materiaNombre || "Materia",
              },
            });
          }
          break;

        case "admin_decision":
          console.log(
            "[Notificación] Decisión de admin, permaneciendo en notificaciones",
          );
          // Ya estamos en la pantalla de notificaciones, no hacemos nada más
          break;

        default:
          console.log("[Notificación] Acción no reconocida:", metadata.accion);
          break;
      }
    } catch (error) {
      console.error("Error al navegar desde notificación:", error);
    }
  };

  // Agrupar notificaciones por período (hoy, ayer, anteriores)
  const grupos = useMemo(() => {
    const ahora = new Date();
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
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
    titulo: string,
  ) => {
    setNotifToDelete({ id: notifUsuarioId, titulo });
    setDialogVisible(true);
  };

  const eliminarDirecto = async (notifUsuarioId: string) => {
    const notificacionesBackup = notificaciones;
    pendingDeletesRef.current.add(notifUsuarioId);
    setNotificaciones((prev) => prev.filter((n) => n.id !== notifUsuarioId));

    try {
      await eliminarNotificacionUsuario(notifUsuarioId);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      pendingDeletesRef.current.delete(notifUsuarioId);
      setNotificaciones(notificacionesBackup);
      setSnackbarMessage("No se pudo eliminar la notificación");
      setSnackbarVisible(true);
    }
  };

  const confirmarEliminacion = async () => {
    if (!notifToDelete) return;

    const notificacionesBackup = notificaciones;
    pendingDeletesRef.current.add(notifToDelete.id);
    setNotificaciones((prev) => prev.filter((n) => n.id !== notifToDelete.id));
    setDialogVisible(false);
    setNotifToDelete(null);

    try {
      await eliminarNotificacionUsuario(notifToDelete.id);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      pendingDeletesRef.current.delete(notifToDelete.id);
      setNotificaciones(notificacionesBackup);
      setSnackbarMessage("No se pudo eliminar la notificación");
      setSnackbarVisible(true);
    }
  };

  const renderRightActions = () => (
    <View
      style={[
        styles.swipeBackground,
        { backgroundColor: theme.colors.background },
      ]}
    />
  );

  const renderLeftActions = () => (
    <View
      style={[
        styles.swipeBackground,
        { backgroundColor: theme.colors.background },
      ]}
    />
  );

  const eliminarNotificacionesPorFecha = async (dias: number) => {
    setMenuVisible(false);

    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const notificacionesAEliminar = notificaciones.filter((notif) => {
      const fecha = notif.creadoEn?.toDate
        ? notif.creadoEn.toDate()
        : new Date(notif.creadoEn);
      return fecha >= fechaLimite;
    });

    if (notificacionesAEliminar.length === 0) {
      return;
    }

    const notificacionesBackup = notificaciones;
    notificacionesAEliminar.forEach((n) => pendingDeletesRef.current.add(n.id));
    setNotificaciones((prev) =>
      prev.filter(
        (notif) => !notificacionesAEliminar.find((n) => n.id === notif.id),
      ),
    );

    try {
      const ids = notificacionesAEliminar.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error("Error al eliminar notificaciones:", error);
      notificacionesAEliminar.forEach((n) =>
        pendingDeletesRef.current.delete(n.id),
      );
      setNotificaciones(notificacionesBackup);
      setSnackbarMessage("No se pudieron eliminar las notificaciones");
      setSnackbarVisible(true);
    }
  };

  const eliminarNotificacionesUltimas24Horas = async () => {
    setMenuVisible(false);

    const ahora = new Date();
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const notificacionesAEliminar = notificaciones.filter((notif) => {
      const fecha = notif.creadoEn?.toDate
        ? notif.creadoEn.toDate()
        : new Date(notif.creadoEn);
      return fecha >= hace24Horas;
    });

    if (notificacionesAEliminar.length === 0) {
      return;
    }

    const notificacionesBackup = notificaciones;
    notificacionesAEliminar.forEach((n) => pendingDeletesRef.current.add(n.id));
    setNotificaciones((prev) =>
      prev.filter(
        (notif) => !notificacionesAEliminar.find((n) => n.id === notif.id),
      ),
    );

    try {
      const ids = notificacionesAEliminar.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error(
        "Error al eliminar notificaciones de últimas 24 horas:",
        error,
      );
      notificacionesAEliminar.forEach((n) =>
        pendingDeletesRef.current.delete(n.id),
      );
      setNotificaciones(notificacionesBackup);
      setSnackbarMessage("No se pudieron eliminar las notificaciones");
      setSnackbarVisible(true);
    }
  };

  const eliminarTodasLasNotificaciones = async () => {
    setMenuVisible(false);

    if (notificaciones.length === 0) {
      return;
    }

    const notificacionesBackup = notificaciones;
    notificaciones.forEach((n) => pendingDeletesRef.current.add(n.id));
    setNotificaciones([]);

    try {
      const ids = notificacionesBackup.map((notif) => notif.id);
      await eliminarNotificacionesUsuarioBatch(ids);
    } catch (error) {
      console.error("Error al eliminar todas las notificaciones:", error);
      notificacionesBackup.forEach((n) =>
        pendingDeletesRef.current.delete(n.id),
      );
      setNotificaciones(notificacionesBackup);
      setSnackbarMessage("No se pudieron eliminar las notificaciones");
      setSnackbarVisible(true);
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
      case "info":
        return theme.colors.primary;
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
        <Appbar.BackAction
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
        />
        <Appbar.Content title="Notificaciones" />
        <Appbar.Action
          icon="dots-vertical"
          onPress={() => setMenuVisible(true)}
        />
      </Appbar.Header>

      {loading ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <NotificationSectionSkeleton />
          <NotificationSectionSkeleton />
        </ScrollView>
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
          <Dialog.Title
            style={{ textAlign: "center", color: theme.colors.onSurface }}
          >
            Eliminar notificación
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              ¿Estás seguro de que deseas eliminar{" "}
              {`"${notifToDelete?.titulo ?? ""}"`}
              ?
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
          <Dialog.Content style={{ alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              variant="bodyLarge"
              style={{ marginTop: 20, color: theme.colors.onSurface }}
            >
              Eliminando notificaciones...
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        <Text style={{ color: theme.colors.onError }}>{snackbarMessage}</Text>
      </Snackbar>

      {/* Dialog de opciones de borrado */}
      <Portal>
        <Dialog
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}
        >
          <Dialog.Title>Borrar notificaciones</Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 0 }}>
            <TouchableRipple
              onPress={eliminarNotificacionesUltimas24Horas}
              style={{ paddingVertical: 14, paddingHorizontal: 24 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <IconButton
                  icon="clock-time-four-outline"
                  size={22}
                  style={{ margin: 0 }}
                />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface }}
                >
                  Últimas 24 horas
                </Text>
              </View>
            </TouchableRipple>
            <TouchableRipple
              onPress={() => eliminarNotificacionesPorFecha(7)}
              style={{ paddingVertical: 14, paddingHorizontal: 24 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <IconButton
                  icon="calendar-week"
                  size={22}
                  style={{ margin: 0 }}
                />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface }}
                >
                  Última semana
                </Text>
              </View>
            </TouchableRipple>
            <TouchableRipple
              onPress={() => eliminarNotificacionesPorFecha(30)}
              style={{ paddingVertical: 14, paddingHorizontal: 24 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <IconButton
                  icon="calendar-range"
                  size={22}
                  style={{ margin: 0 }}
                />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface }}
                >
                  Últimos 30 días
                </Text>
              </View>
            </TouchableRipple>
            <Divider style={{ marginVertical: 4 }} />
            <TouchableRipple
              onPress={eliminarTodasLasNotificaciones}
              style={{ paddingVertical: 14, paddingHorizontal: 24 }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <IconButton
                  icon="delete-sweep"
                  size={22}
                  style={{ margin: 0 }}
                  iconColor={theme.colors.error}
                />
                <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
                  Borrar todo
                </Text>
              </View>
            </TouchableRipple>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMenuVisible(false)}>Cancelar</Button>
          </Dialog.Actions>
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
    justifyContent: "center",
  },
});
