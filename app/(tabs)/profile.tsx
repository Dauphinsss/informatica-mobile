import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Surface,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const navigation: any = useNavigation();
  const user = auth.currentUser;
  const { themeMode, setThemeMode, theme } = useTheme();
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const slideAnim4 = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.stagger(100, [
        Animated.spring(slideAnim1, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim2, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim3, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim4, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "usuarios", uid), { 
          pushTokens: [],
          tokens: [], 
        });
        console.log("🔑 tokens borrados en Firestore");
      }
      await GoogleSignin.signOut();
      await signOut(auth);
      console.log("✅ Sesión cerrada");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };

  if (!user) {
    return null;
  }

  const getThemeLabel = () => {
    switch (themeMode) {
      case "light":
        return "Claro";
      case "dark":
        return "Oscuro";
      case "system":
        return "Automático (sistema)";
      default:
        return "Automático (sistema)";
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Perfil" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header animado con avatar */}
        <Animated.View
          style={[
            styles.headerCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Surface style={styles.surface} elevation={2}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {user.photoURL ? (
                  <Avatar.Image
                    size={90}
                    source={{ uri: user.photoURL }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Icon
                    size={90}
                    icon="account"
                    style={styles.avatar}
                  />
                )}
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              </View>
              <Text variant="headlineSmall" style={styles.name}>
                {user.displayName || "Usuario"}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user.email}
              </Text>
            </View>
          </Surface>
        </Animated.View>

        {/* Información de la cuenta */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim1 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="account-details"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Información de la cuenta
                </Text>
              </View>
              <Divider style={styles.divider} />
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Nombre completo
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {user.displayName || "No disponible"}
                  </Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Correo electrónico
                  </Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {user.email || "No disponible"}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Publicaciones */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim2 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <List.Item
              title="Mis Publicaciones"
              description="Ver todas tus publicaciones"
              left={(props) => (
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => navigation.navigate("MisPublicacionesScreen")}
              style={styles.listItem}
            />
          </Card>
        </Animated.View>

        {/* Configuración */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim3 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="cog"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Configuración
                </Text>
              </View>
            </Card.Content>
            <List.Item
              title="Apariencia"
              description={getThemeLabel()}
              left={(props) => (
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="theme-light-dark"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => setThemeDialogVisible(true)}
            />
            <List.Item
              title="Notificaciones"
              description="Gestionar notificaciones"
              left={(props) => (
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="bell"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => {}}
            />
            <List.Item
              title="Privacidad"
              description="Configuración de privacidad"
              left={(props) => (
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => {}}
            />
            <List.Item
              title="Ayuda"
              description="Centro de ayuda"
              left={(props) => (
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name="help-circle"
                    size={24}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              onPress={() => {}}
            />
          </Card>
        </Animated.View>

        {/* Botón de cerrar sesión */}
        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim4 }],
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
          >
            Cerrar sesión
          </Button>
        </Animated.View>
      </ScrollView>

      {/* Dialog para seleccionar tema */}
      <Portal>
        <Dialog
          visible={themeDialogVisible}
          onDismiss={() => setThemeDialogVisible(false)}
        >
          <Dialog.Title>Apariencia</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={(value) => {
                setThemeMode(value as "light" | "dark" | "system");
                setThemeDialogVisible(false);
              }}
              value={themeMode}
            >
              <List.Item
                title="Claro"
                left={(props) => (
                  <List.Icon {...props} icon="white-balance-sunny" />
                )}
                right={() => <RadioButton value="light" />}
                onPress={() => {
                  setThemeMode("light");
                  setThemeDialogVisible(false);
                }}
              />
              <List.Item
                title="Oscuro"
                left={(props) => (
                  <List.Icon {...props} icon="moon-waning-crescent" />
                )}
                right={() => <RadioButton value="dark" />}
                onPress={() => {
                  setThemeMode("dark");
                  setThemeDialogVisible(false);
                }}
              />
              <List.Item
                title="Automático (sistema)"
                description="Usar configuración del sistema"
                left={(props) => (
                  <List.Icon {...props} icon="brightness-auto" />
                )}
                right={() => <RadioButton value="system" />}
                onPress={() => {
                  setThemeMode("system");
                  setThemeDialogVisible(false);
                }}
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setThemeDialogVisible(false)}>
              Cancelar
            </Button>
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
    padding: 16,
  },
  headerCard: {
    marginBottom: 20,
  },
  surface: {
    borderRadius: 16,
    overflow: "hidden",
  },
  profileSection: {
    alignItems: "center",
    padding: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "transparent",
  },
  statusDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "600",
  },
  divider: {
    marginVertical: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  infoValue: {
    fontWeight: "500",
  },
  iconWrapper: {
    marginLeft: 8,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listItem: {
    paddingVertical: 4,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 40,
    borderRadius: 8,
  },
});
