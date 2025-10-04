import { auth } from "@/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Divider,
  List,
  Text,
} from "react-native-paper";

export default function ProfileScreen() {
  const user = auth.currentUser;

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

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Perfil" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.profileContent}>
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
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Información de la cuenta
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          <List.Item
            title="Nombre completo"
            description={user.displayName || "No disponible"}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          <List.Item
            title="Correo electrónico"
            description={user.email || "No disponible"}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="ID de usuario"
            description={user.uid}
            left={(props) => <List.Icon {...props} icon="identifier" />}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Configuración
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
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
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.logoutButton}
        >
          Cerrar sesión
        </Button>
      </ScrollView>
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
  card: {
    marginBottom: 16,
  },
  profileContent: {
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
    marginVertical: 16,
  },
});
