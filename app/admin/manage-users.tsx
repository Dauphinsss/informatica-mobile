import { useTheme } from "@/contexts/ThemeContext";
import { registrarActividadCliente } from "@/services/activity.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityListSkeleton } from "./components/SkeletonLoaders";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Searchbar,
  Text,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase";

const ManageUsers = () => {
  const DEFAULT_SUSPEND_REASON = "Incumplimiento de normas de la comunidad.";
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "usuario" | "admin" | "suspendido">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigation = useNavigation();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionType, setActionType] = useState<"activate" | "suspend">(
    "suspend"
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOpacity, setExpandedOpacity] = useState<string | null>(null);
  const expandAnimationsRef = React.useRef<Record<string, Animated.Value>>({});

  const getJoinedMillis = (user: any): number => {
    const raw = user?.creadoEn ?? user?.createdAt ?? user?.fechaRegistro;
    if (!raw) return Number.MAX_SAFE_INTEGER;
    if (typeof raw?.toMillis === "function") return raw.toMillis();
    if (typeof raw?.seconds === "number") return raw.seconds * 1000;
    const parsed = new Date(raw).getTime();
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  };
  const formatJoinDate = (user: any): string => {
    const raw = user?.creadoEn ?? user?.createdAt ?? user?.fechaRegistro;
    if (!raw) return "No disponible";

    let date: Date | null = null;
    if (typeof raw?.toDate === "function") {
      date = raw.toDate();
    } else if (typeof raw?.seconds === "number") {
      date = new Date(raw.seconds * 1000);
    } else {
      const parsed = new Date(raw);
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (!date) return "No disponible";
    return date.toLocaleDateString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (filter === "usuario") {
      filtered = filtered.filter((user) => user.rol === "usuario");
    } else if (filter === "admin") {
      filtered = filtered.filter((user) => user.rol === "admin");
    } else if (filter === "suspendido") {
      filtered = filtered.filter((user) => user.estado === "suspendido");
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          (user.nombre && user.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.correo && user.correo.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return [...filtered].sort((a, b) => getJoinedMillis(a) - getJoinedMillis(b));
  };

  const filteredUsers = getFilteredUsers();

  const totalUsers = users.filter((user) => user.rol === "usuario").length;
  const totalAdmins = users.filter((user) => user.rol === "admin").length;
  const totalSuspended = users.filter((user) => user.estado === "suspendido").length;

  const getOrCreateAnimation = (userId: string) => {
    const existing = expandAnimationsRef.current[userId];
    if (!existing) {
      expandAnimationsRef.current[userId] = new Animated.Value(0);
    }
    return expandAnimationsRef.current[userId];
  };

  const handleToggleExpand = (userId: string) => {
    const isExpanding = expandedUser !== userId;
    const targetAnimation = getOrCreateAnimation(userId);
    const previousExpanded = expandedUser;
    const previousAnimation = previousExpanded
      ? getOrCreateAnimation(previousExpanded)
      : null;

    if (isExpanding) {
      setExpandedOpacity(userId);
      setExpandedUser(userId);
      Animated.parallel([
        previousAnimation
          ? Animated.timing(previousAnimation, {
              toValue: 0,
              duration: 170,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            })
          : Animated.timing(new Animated.Value(0), {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
        Animated.timing(targetAnimation, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(targetAnimation, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setExpandedUser(null);
        setExpandedOpacity(null);
      });
    }
  };

  const openConfirmDialog = (user: any, action: "activate" | "suspend") => {
    setSelectedUser(user);
    setActionType(action);
    setSuspendReason("");
    setDialogVisible(true);
  };

  const closeConfirmDialog = () => {
    if (actionLoading) return;
    setDialogVisible(false);
    setSelectedUser(null);
    setSuspendReason("");
  };

  const confirmAction = async () => {
    if (!selectedUser || actionLoading) return;

    const newStatus = actionType === "activate" ? "activo" : "suspendido";
    const trimmedReason = suspendReason.trim();
    const reasonToSave = trimmedReason || DEFAULT_SUSPEND_REASON;

    try {
      setActionLoading(true);
      const userRef = doc(db, "usuarios", selectedUser.uid);
      if (actionType === "suspend") {
        await updateDoc(userRef, {
          estado: newStatus,
          motivoSuspension: reasonToSave,
          razonSuspension: reasonToSave,
          motivoBan: reasonToSave,
          suspendidoEn: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          estado: newStatus,
          motivoSuspension: null,
          razonSuspension: null,
          motivoBan: null,
          suspendidoEn: null,
        });
      }
      
      const activityType = actionType === "suspend" ? "usuario_baneado" : "usuario_desbaneado";
      const usuarioNombre =
        selectedUser?.nombre ||
        selectedUser?.correo ||
        'Usuario sin nombre';
      const usuarioCorreo = selectedUser?.correo || selectedUser?.email || 'sin correo';

      const titulo = actionType === "suspend"
        ? `Usuario ${usuarioNombre} suspendido`
        : `Usuario ${usuarioNombre} reactivado`;

      const descripcion = actionType === "suspend"
        ? `El administrador ha suspendido la cuenta del usuario con correo ${usuarioCorreo}. Motivo: ${reasonToSave}`
        : `El administrador ha reactivado la cuenta del usuario con correo ${usuarioCorreo}.`;
      registrarActividadCliente(
        activityType,
        titulo,
        descripcion,
        auth.currentUser?.uid,
        auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
        selectedUser.uid,
        {
          usuarioNombre: usuarioNombre,
          usuarioEmail: usuarioCorreo,
          estadoPrevio: selectedUser?.estado || 'desconocido',
          estadoNuevo: newStatus,
          motivo: actionType === "suspend" ? reasonToSave : null,
        }
      ).catch((error) => {
        console.error("[Manage Users] Error registrando actividad:", error);
      });
      
      closeConfirmDialog();
    } catch (error) {
      console.error("Error al actualizar el estado del usuario:", error);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const usersCollection = collection(db, "usuarios");

    const unsubscribe = onSnapshot(
      usersCollection,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          ...doc.data(),
          uid: doc.id,
        }));
        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error al escuchar cambios de usuarios:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Administrar Usuarios" />
          <Appbar.Action
            icon="magnify"
            onPress={() => setSearchOpen(!searchOpen)}
          />
        </Appbar.Header>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {searchOpen && (
            <Searchbar
              placeholder="Buscar por nombre o email"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              autoFocus
            />
          )}

          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                onPress={() => setFilter("all")}
                style={[
                  styles.filterChip,
                  filter === "all"
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : { backgroundColor: theme.colors.surfaceVariant },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filter === "all"
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Todos {users.length}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilter("usuario")}
                style={[
                  styles.filterChip,
                  filter === "usuario"
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : { backgroundColor: theme.colors.surfaceVariant },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filter === "usuario"
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Usuarios {totalUsers}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilter("suspendido")}
                style={[
                  styles.filterChip,
                  filter === "suspendido"
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : { backgroundColor: theme.colors.surfaceVariant },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filter === "suspendido"
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Suspendidos {totalSuspended}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilter("admin")}
                style={[
                  styles.filterChip,
                  filter === "admin"
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : { backgroundColor: theme.colors.surfaceVariant },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        filter === "admin"
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Admins {totalAdmins}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {loading ? (
            <ActivityListSkeleton count={5} />
          ) : filteredUsers.length > 0 ? (
            <View style={styles.userSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {filter === "all"
                  ? "Todos los Usuarios"
                  : filter === "admin"
                  ? "Administradores"
                  : filter === "suspendido"
                  ? "Usuarios Suspendidos"
                  : "Usuarios"}
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {searchQuery
                  ? `${filteredUsers.length} resultado(s)`
                  : `Total: ${filteredUsers.length} usuario(s)`}
              </Text>
              <Divider style={styles.divider} />
              {filteredUsers.map((user) => {
                const animation = getOrCreateAnimation(user.uid);
                const maxHeight = animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 380],
                });

                return (
                  <View key={user.uid}>
                    <View
                      style={[
                        user.estado === "suspendido" &&
                          styles.suspendedUserItem,
                      ]}
                    >
                        <List.Item
                          title={user.nombre || "Sin nombre"}
                          description={user.correo || "Sin correo"}
                          titleStyle={[
                            styles.userName,
                            user.estado === "suspendido" &&
                              styles.suspendedUserName,
                          ]}
                          descriptionStyle={styles.userEmail}
                          left={(props) => (
                            <View style={styles.avatarContainer}>
                              {user.foto ? (
                                <Avatar.Image
                                  size={40}
                                  source={{ uri: user.foto }}
                                  style={[
                                    styles.avatar,
                                    user.estado === "suspendido" &&
                                      styles.suspendedAvatar,
                                  ]}
                                />
                              ) : (
                                <Avatar.Icon
                                  size={40}
                                  icon={
                                    user.rol === "admin"
                                      ? "shield-account"
                                      : "account"
                                  }
                                  style={[
                                    styles.avatar,
                                    user.estado === "suspendido" &&
                                      styles.suspendedAvatar,
                                  ]}
                                />
                              )}
                              {user.estado === "suspendido" && (
                                <View style={styles.suspendedIndicator} />
                              )}
                            </View>
                          )}
                          right={(props) => (
                            <View style={styles.rightContainer}>
                              {user.rol === "admin" && (
                                <MaterialCommunityIcons
                                  name="shield-crown"
                                  size={18}
                                  color={theme.colors.primary}
                                  style={styles.adminIcon}
                                />
                              )}
                              <TouchableOpacity
                                onPress={() => handleToggleExpand(user.uid)}
                              >
                                <MaterialCommunityIcons
                                  name={
                                    expandedUser === user.uid
                                      ? "chevron-up"
                                      : "chevron-down"
                                  }
                                  size={24}
                                  color={theme.colors.onSurfaceVariant}
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                          onPress={() => handleToggleExpand(user.uid)}
                        />

                        {expandedUser === user.uid && (
                          <Animated.View
                            style={[
                              styles.collapseWrapper,
                              {
                                maxHeight,
                                overflow: "hidden",
                                opacity:
                                  expandedOpacity === user.uid ? maxHeight.interpolate({
                                    inputRange: [0, 120, 420],
                                    outputRange: [0, 0.65, 1],
                                    extrapolate: "clamp",
                                  }) : 1,
                              },
                            ]}
                          >
                            <View style={styles.collapseContent}>
                              <View style={styles.infoSection}>
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.infoLabel,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  INFORMACIÓN
                                </Text>

                                <View style={styles.infoRow}>
                                  <MaterialCommunityIcons
                                    name="account-badge"
                                    size={18}
                                    color={theme.colors.onSurfaceVariant}
                                  />
                                  <Text variant="bodyMedium" style={styles.infoText}>
                                    Rol: {user.rol === "admin" ? "Administrador" : "Usuario"}
                                  </Text>
                                </View>

                                <View style={styles.infoRow}>
                                  <MaterialCommunityIcons
                                    name="calendar"
                                    size={18}
                                    color={theme.colors.onSurfaceVariant}
                                  />
                                  <Text variant="bodyMedium" style={styles.infoText}>
                                    Se unió: {formatJoinDate(user)}
                                  </Text>
                                </View>

                                <View style={styles.infoRow}>
                                  <MaterialCommunityIcons
                                    name={
                                      user.estado === "suspendido"
                                        ? "cancel"
                                        : "check-circle"
                                    }
                                    size={18}
                                    color={
                                      user.estado === "suspendido"
                                        ? theme.colors.error
                                        : theme.colors.primary
                                    }
                                  />
                                  <Text variant="bodyMedium" style={styles.infoText}>
                                    Estado:{" "}
                                    <Text
                                      style={{
                                        fontWeight: "bold",
                                        color:
                                          user.estado === "suspendido"
                                            ? theme.colors.error
                                            : theme.colors.primary,
                                      }}
                                    >
                                      {user.estado === "suspendido"
                                        ? "Suspendido"
                                        : "Activo"}
                                    </Text>
                                  </Text>
                                </View>

                                {user.estado === "suspendido" && (
                                  <View
                                    style={[
                                      styles.reasonBox,
                                      {
                                        backgroundColor: theme.colors.surfaceVariant,
                                      },
                                    ]}
                                  >
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.reasonLabel,
                                        { color: theme.colors.onSurfaceVariant },
                                      ]}
                                    >
                                      MOTIVO
                                    </Text>
                                    <Text
                                      variant="bodySmall"
                                      style={[
                                        styles.reasonText,
                                        { color: theme.colors.onSurface },
                                      ]}
                                    >
                                      {user.motivoSuspension || DEFAULT_SUSPEND_REASON}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              
                              <View style={styles.actionButtons}>
                                {user.estado !== "suspendido" &&
                                  user.rol !== "admin" &&
                                  user.uid !== auth.currentUser?.uid && (
                                    <Button
                                      mode="contained"
                                      onPress={() =>
                                        openConfirmDialog(user, "suspend")
                                      }
                                      style={styles.actionButton}
                                      contentStyle={styles.actionButtonContent}
                                      labelStyle={styles.actionButtonLabel}
                                      buttonColor={theme.colors.primary}
                                      textColor={theme.colors.onPrimary}
                                      icon="account-cancel"
                                    >
                                      Suspender
                                    </Button>
                                  )}
                                {user.estado === "suspendido" &&
                                  user.rol !== "admin" &&
                                  user.uid !== auth.currentUser?.uid && (
                                    <Button
                                      mode="contained"
                                      onPress={() =>
                                        openConfirmDialog(user, "activate")
                                      }
                                      style={styles.actionButton}
                                      contentStyle={styles.actionButtonContent}
                                      labelStyle={styles.actionButtonLabel}
                                      buttonColor={theme.colors.secondaryContainer}
                                      textColor={theme.colors.onSecondaryContainer}
                                      icon="account-check"
                                    >
                                      Activar
                                    </Button>
                                  )}
                              </View>
                            </View>
                          </Animated.View>
                        )}
                    </View>
                    <Divider />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No se encontraron usuarios.
              </Text>
            </View>
          )}
        </ScrollView>

        <Portal>
          <Dialog
            visible={dialogVisible}
            dismissable={!actionLoading}
            onDismiss={closeConfirmDialog}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <View style={styles.dialogTitleRow}>
              <Dialog.Title style={{ color: theme.colors.onSurface }}>
                {actionType === "activate"
                  ? "Activar Usuario"
                  : "Suspender Usuario"}
              </Dialog.Title>
              <IconButton
                icon="close"
                size={20}
                onPress={closeConfirmDialog}
                disabled={actionLoading}
                style={styles.dialogClose}
              />
            </View>
            <Dialog.Content>
              <Text style={{ color: theme.colors.onSurface }}>
                {actionType === "activate"
                  ? `¿Estás seguro de que quieres activar a ${selectedUser?.nombre || "este usuario"}?`
                  : `¿Estás seguro de que quieres suspender a ${selectedUser?.nombre || "este usuario"}?`}
              </Text>
              {actionType === "suspend" && (
                <>
                  <TextInput
                    label="Razón de suspensión (opcional)"
                    mode="outlined"
                    value={suspendReason}
                    onChangeText={setSuspendReason}
                    multiline
                    numberOfLines={3}
                    style={{ marginTop: 14 }}
                    placeholder={DEFAULT_SUSPEND_REASON}
                  />
                  
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={closeConfirmDialog}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                onPress={confirmAction}
                mode="contained"
                loading={actionLoading}
                disabled={actionLoading}
              >
                {actionType === "activate" ? "Activar" : "Suspender"}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  userSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  filterContainer: {
    marginBottom: 10,
  },
  filterScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 0,
  },
  filterChip: {
    height: 38,
    borderRadius: 20,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 102,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  avatarContainer: {
    position: "relative",
    marginLeft: 8,
  },
  avatar: {
    marginLeft: 0,
  },
  suspendedAvatar: {
    opacity: 0.5,
  },
  suspendedIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F44336",
    borderWidth: 2,
    borderColor: "#fff",
  },
  suspendedUserItem: {
    opacity: 0.85,
  },
  suspendedUserName: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },

  userName: {
    fontSize: 15,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminIcon: {
    marginHorizontal: 4,
  },

  collapseWrapper: {
    overflow: "hidden",
  },
  collapseContent: {
    padding: 16,
    paddingTop: 12,
  },

  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
  },

  actionsLabel: {
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 999,
  },
  actionButtonContent: {
    minHeight: 42,
  },
  actionButtonLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  reasonBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  reasonLabel: {
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  reasonText: {
    lineHeight: 18,
    opacity: 0.9,
  },
  noActionText: {
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  dialogTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
  },
  dialogClose: {
    margin: 0,
  },
});

export default ManageUsers;
