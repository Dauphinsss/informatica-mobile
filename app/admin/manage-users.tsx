import { useTheme } from "@/contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
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
  const navigation = useNavigation();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"activate" | "suspend">(
    "suspend"
  );

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
          user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.correo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const adminUsers = filteredUsers.filter((user) => user.rol === "admin");
  const normalUsers = filteredUsers.filter((user) => user.rol === "usuario");

  const totalAdmins = users.filter((user) => user.rol === "admin").length;
  const totalUsers = users.filter((user) => user.rol === "usuario").length;

  const handleToggleExpand = (userId: string) => {
    setExpandedUser((prevState) => (prevState === userId ? null : userId));
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
        </Appbar.Header>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Buscador dinámico */}
          <Searchbar
            placeholder="Buscar por nombre o email"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

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

          {/* Card para Usuarios */}
          {normalUsers.length > 0 &&
            (filter === "all" || filter === "usuario") && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Usuarios
                  </Text>
                  <Text variant="bodyMedium" style={styles.subtitle}>
                    {searchQuery
                      ? `${normalUsers.length} de ${totalUsers} usuarios`
                      : `Total: ${normalUsers.length} usuarios`}
                  </Text>
                  <Divider style={styles.divider} />
                </Card.Content>
                {normalUsers.map((user) => (
                  <View key={user.uid}>
                    <TouchableWithoutFeedback>
                      <View>
                        <List.Item
                          title={user.nombre}
                          description={`${user.correo} • Estado: ${
                            user.estado || "activo"
                          }`}
                          left={(props) => (
                            <List.Icon {...props} icon="account" />
                          )}
                          right={(props) => (
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
                                color="#666"
                              />
                            </TouchableOpacity>
                          )}
                          onPress={() => handleToggleExpand(user.uid)}
                        />

                        {/* Collapse personalizado */}
                        {expandedUser === user.uid && (
                          <TouchableWithoutFeedback>
                            <View
                              style={[
                                styles.collapseContent,
                                {
                                  backgroundColor: theme.colors.surfaceVariant,
                                  borderLeftColor: theme.colors.primary,
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.actionsLabel,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                Acciones de usuario:
                              </Text>
                              <View style={styles.actionButtons}>
                                <Button
                                  mode="contained"
                                  onPress={() =>
                                    openConfirmDialog(user, "suspend")
                                  }
                                  disabled={
                                    user.estado === "suspendido" ||
                                    user.uid === auth.currentUser?.uid
                                  }
                                  buttonColor={theme.colors.errorContainer}
                                  textColor={theme.colors.onErrorContainer}
                                  style={styles.actionButton}
                                  icon="account-cancel"
                                >
                                  Suspender
                                </Button>
                                <Button
                                  mode="contained"
                                  onPress={() =>
                                    openConfirmDialog(user, "activate")
                                  }
                                  disabled={
                                    user.estado === "activo" ||
                                    user.uid === auth.currentUser?.uid
                                  }
                                  buttonColor={theme.colors.primaryContainer}
                                  textColor={theme.colors.onPrimaryContainer}
                                  style={styles.actionButton}
                                  icon="account-check"
                                >
                                  Activar
                                </Button>
                              </View>
                            </View>
                          </TouchableWithoutFeedback>
                        )}
                      </View>
                    </TouchableWithoutFeedback>
                    <Divider />
                  </View>
                ))}
              </Card>
            )}

          {/* Card para Admins */}
          {adminUsers.length > 0 &&
            (filter === "all" || filter === "admin") && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Administradores
                  </Text>
                  <Text variant="bodyMedium" style={styles.subtitle}>
                    {searchQuery
                      ? `${adminUsers.length} de ${totalAdmins} administradores`
                      : `Total: ${adminUsers.length} administradores`}
                  </Text>
                  <Divider style={styles.divider} />
                </Card.Content>
                {adminUsers.map((user) => (
                  <View key={user.uid}>
                    <TouchableWithoutFeedback>
                      <View>
                        <List.Item
                          title={user.nombre}
                          description={`${user.correo} • Estado: ${
                            user.estado || "activo"
                          }`}
                          left={(props) => (
                            <List.Icon {...props} icon="shield-account" />
                          )}
                          right={(props) => (
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
                                color="#666"
                              />
                            </TouchableOpacity>
                          )}
                          onPress={() => handleToggleExpand(user.uid)}
                        />

                        {/* Collapse personalizado */}
                        {expandedUser === user.uid && (
                          <TouchableWithoutFeedback>
                            <View
                              style={[
                                styles.collapseContent,
                                {
                                  backgroundColor: theme.colors.surfaceVariant,
                                  borderLeftColor: theme.colors.primary,
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.actionsLabel,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                Acciones de administrador:
                              </Text>
                              <View style={styles.actionButtons}>
                                <Button
                                  mode="contained"
                                  onPress={() =>
                                    openConfirmDialog(user, "suspend")
                                  }
                                  disabled={
                                    user.estado === "suspendido" ||
                                    user.uid === auth.currentUser?.uid
                                  }
                                  buttonColor={theme.colors.errorContainer}
                                  textColor={theme.colors.onErrorContainer}
                                  style={styles.actionButton}
                                  icon="account-cancel"
                                >
                                  Suspender
                                </Button>
                                <Button
                                  mode="contained"
                                  onPress={() =>
                                    openConfirmDialog(user, "activate")
                                  }
                                  disabled={
                                    user.estado === "activo" ||
                                    user.uid === auth.currentUser?.uid
                                  }
                                  buttonColor={theme.colors.primaryContainer}
                                  textColor={theme.colors.onPrimaryContainer}
                                  style={styles.actionButton}
                                  icon="account-check"
                                >
                                  Activar
                                </Button>
                              </View>
                            </View>
                          </TouchableWithoutFeedback>
                        )}
                      </View>
                    </TouchableWithoutFeedback>
                    <Divider />
                  </View>
                ))}
              </Card>
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
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

  // Nuevos estilos para collapse
  collapseContent: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  actionsLabel: {
    marginBottom: 12,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ManageUsers;
