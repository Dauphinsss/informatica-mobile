import { auth } from "@/firebase";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Divider, List, Text } from "react-native-paper";

export default function HomeScreen() {
  const user = auth.currentUser;

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Inicio" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.greeting}>
              ¡Hola, {user.displayName?.split(" ")[0] || "Usuario"}!
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Bienvenido a tu aplicación
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accesos rápidos
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          <List.Item
            title="Configuración"
            description="Ajusta tus preferencias"
            left={(props) => <List.Icon {...props} icon="cog" />}
            onPress={() => {}}
          />
          <List.Item
            title="Notificaciones"
            description="Gestiona tus alertas"
            left={(props) => <List.Icon {...props} icon="bell" />}
            onPress={() => {}}
          />
          <List.Item
            title="Ayuda"
            description="Preguntas frecuentes"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => {}}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  greeting: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
});
