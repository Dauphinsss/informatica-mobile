import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Text,
} from "react-native-paper";

export default function ProfileScreen() {
  const user = auth.currentUser;
  const { themeMode, setThemeMode, theme } = useTheme();
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
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

      <ScrollView style={styles.content}>
        <View style={[styles.section, styles.profileSection]}>
          {user.photoURL && (
            <Avatar.Image
              size={100}
              source={{ uri: user.photoURL }}
              style={styles.avatar}
            />
          )}
          <Text variant="headlineSmall" style={styles.name}>
            {user.displayName || "Usuario"}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Informacion de la cuenta
          </Text>
          <Divider style={styles.divider} />
          <List.Item
            title="Nombre completo"
            description={user.displayName || "No disponible"}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Correo electronico"
            description={user.email || "No disponible"}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Configuracion
          </Text>
          <Divider style={styles.divider} />
          <List.Item
            title="Apariencia"
            description={getThemeLabel()}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setThemeDialogVisible(true)}
          />
          <List.Item
            title="Notificaciones"
            description="Gestionar notificaciones"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Privacidad"
            description="Configuración de privacidad"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Ayuda"
            description="Centro de ayuda"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
        >
          Cerrar sesión
        </Button>
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
  section: {
    marginBottom: 16,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatar: {
    marginBottom: 16,
  },
  name: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 40,
  },
});
