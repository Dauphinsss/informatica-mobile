import { useTheme } from "@/contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Chip,
  Dialog,
  Divider,
  List,
  Portal,
  Searchbar,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebase";

const ManageUsers = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "admin" | "usuario">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigation = useNavigation();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"activate" | "suspend">(
    "suspend"
  );
  const [expandAnimations, setExpandAnimations] = useState<{
    [key: string]: Animated.Value;
  }>({});

  {
    /* Función para filtrar usuarios según el filtro seleccionado y la búsqueda */
  }
  const getFilteredUsers = () => {
    let filtered = users;

    {
      /* Filtrar por rol */
    }
    if (filter === "admin") {
      filtered = filtered.filter((user) => user.rol === "admin");
    } else if (filter === "usuario") {
      filtered = filtered.filter((user) => user.rol === "usuario");
    }

    {
      /* Filtrar por búsqueda */
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          (user.nombre && user.nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.correo && user.correo.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  const totalAdmins = users.filter((user) => user.rol === "admin").length;
  const totalUsers = users.filter((user) => user.rol === "usuario").length;

  const getOrCreateAnimation = (userId: string) => {
    if (!expandAnimations[userId]) {
      const newAnim = new Animated.Value(0);
      setExpandAnimations((prev) => ({ ...prev, [userId]: newAnim }));
      return newAnim;
    }
    return expandAnimations[userId];
  };

  const handleToggleExpand = (userId: string) => {
    const isExpanding = expandedUser !== userId;
    const animation = getOrCreateAnimation(userId);

    if (isExpanding) {
      setExpandedUser(userId);
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setExpandedUser(null);
      });
    }
  };

  const handleCloseCollapse = () => {
    setExpandedUser(null);
  };

  const openConfirmDialog = (user: any, action: "activate" | "suspend") => {
    setSelectedUser(user);
    setActionType(action);
    setDialogVisible(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    const newStatus = actionType === "activate" ? "activo" : "suspendido";

    try {
      const userRef = doc(db, "usuarios", selectedUser.uid);
      await updateDoc(userRef, { estado: newStatus });

      // Ya no necesitamos actualizar manualmente, onSnapshot lo hará automáticamente
      setDialogVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error al actualizar el estado del usuario:", error);
    }
  };

  // Listener en tiempo real para usuarios
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
      },
      (error) => {
        console.error("Error al escuchar cambios de usuarios:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleCloseCollapse}>
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
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Buscador dinámico */}
          {searchOpen && (
            <Searchbar
              placeholder="Buscar por nombre o email"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              autoFocus
            />
          )}

          {/* Filtros de usuarios */}
          <View style={styles.filterButtons}>
            <Button
              mode={filter === "all" ? "contained" : "outlined"}
              onPress={() => setFilter("all")}
              style={styles.filterButton}
              compact
            >
              Todos {users.length}
            </Button>
            <Button
              mode={filter === "usuario" ? "contained" : "outlined"}
              onPress={() => setFilter("usuario")}
              style={styles.filterButton}
              compact
            >
              Usuarios {totalUsers}
            </Button>
            <Button
              mode={filter === "admin" ? "contained" : "outlined"}
              onPress={() => setFilter("admin")}
              style={styles.filterButton}
              compact
            >
              Admins {totalAdmins}
            </Button>
          </View>

          {/* Lista Unificada de Usuarios */}
          {filteredUsers.length > 0 && (
            <View style={styles.userSection}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {filter === "all"
                  ? "Todos los Usuarios"
                  : filter === "admin"
                  ? "Administradores"
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
                  outputRange: [0, 300],
                });

                return (
                  <View key={user.uid}>
                    <TouchableWithoutFeedback>
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

                        {/* Collapse animado */}
                        {expandedUser === user.uid && (
                          <Animated.View
                            style={[
                              styles.collapseWrapper,
                              { maxHeight, overflow: "hidden" },
                            ]}
                          >
                            <View style={styles.collapseContent}>
                              {/* Información del usuario */}
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
                              </View>

                              {/* Acciones */}
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.actionsLabel,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                ACCIONES
                              </Text>
                              <View style={styles.actionButtons}>
                                {user.estado !== "suspendido" &&
                                  user.uid !== auth.currentUser?.uid && (
                                    <Button
                                      mode="contained"
                                      onPress={() =>
                                        openConfirmDialog(user, "suspend")
                                      }
                                      style={styles.actionButton}
                                      icon="account-cancel"
                                    >
                                      Suspender
                                    </Button>
                                  )}
                                {user.estado === "suspendido" &&
                                  user.uid !== auth.currentUser?.uid && (
                                    <Button
                                      mode="contained"
                                      onPress={() =>
                                        openConfirmDialog(user, "activate")
                                      }
                                      style={styles.actionButton}
                                      icon="account-check"
                                    >
                                      Activar
                                    </Button>
                                  )}
                                {user.uid === auth.currentUser?.uid && (
                                  <Text
                                    variant="bodySmall"
                                    style={[
                                      styles.noActionText,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    No puedes modificar tu propia cuenta
                                  </Text>
                                )}
                              </View>
                            </View>
                          </Animated.View>
                        )}
                      </View>
                    </TouchableWithoutFeedback>
                    <Divider />
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Dialog de confirmación */}
        <Portal>
          <Dialog
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dialog.Title style={{ color: theme.colors.onSurface }}>
              {actionType === "activate"
                ? "Activar Usuario"
                : "Suspender Usuario"}
            </Dialog.Title>
            <Dialog.Content>
              <Text style={{ color: theme.colors.onSurface }}>
                {actionType === "activate"
                  ? `¿Estás seguro de que quieres activar a ${selectedUser?.nombre}?`
                  : `¿Estás seguro de que quieres suspender a ${selectedUser?.nombre}?`}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
              <Button onPress={confirmAction} mode="contained">
                {actionType === "activate" ? "Activar" : "Suspender"}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </TouchableWithoutFeedback>
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
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 16,
  },
  filterButton: {
    marginHorizontal: 4,
    flex: 1,
  },

  // Avatar y estado suspendido
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

  // Usuario item
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

  // Estilos para collapse animado
  collapseWrapper: {
    overflow: "hidden",
  },
  collapseContent: {
    padding: 16,
    paddingTop: 12,
  },

  // Sección de información
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

  // Acciones
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
  },
  noActionText: {
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
});

export default ManageUsers;
