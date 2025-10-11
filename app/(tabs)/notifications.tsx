import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Divider, List, Text } from "react-native-paper";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const user = auth.currentUser;

  if (!user) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Notificaciones" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recientes
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          <List.Item
            title="Bienvenido a Informatica"
            description="Gracias por unirte a nuestra aplicación"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <Text variant="bodySmall">Ahora</Text>}
          />
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Anteriores
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          <List.Item
            title="Configuración de cuenta"
            description="Tu cuenta ha sido configurada correctamente"
            left={(props) => <List.Icon {...props} icon="check-circle" />}
            right={(props) => <Text variant="bodySmall">1d</Text>}
          />
          <List.Item
            title="Actualización disponible"
            description="Hay nuevas funciones disponibles"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <Text variant="bodySmall">3d</Text>}
          />
        </Card>
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
  sectionTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
});
