import { auth } from "@/firebase";
import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Card, Divider, List, Text } from "react-native-paper";
import { getEnrolledSubjects } from "../subjects/mock-subjects";

export default function HomeScreen() {
  const user = auth.currentUser;
  const navigation = useNavigation();
  const enrolledSubjects = getEnrolledSubjects();

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
              Mis Materias
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Tienes {enrolledSubjects.length} materias inscritas
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          
          {/* Mostrar las primeras 3 materias */}
          {enrolledSubjects.slice(0, 3).map((subject, index) => (
            <List.Item
              key={subject.id}
              title={subject.name}
              description={`${subject.code} • ${subject.materialsCount} materiales`}
              left={(props) => <List.Icon {...props} icon="book-open-variant" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navegación simple por ahora
                console.log('Navegar a detalles de materia:', subject.name);
              }}
            />
          ))}
          
          <Card.Content>
            <Button 
              mode="contained" 
              onPress={() => {
                navigation.navigate('MySubjects' as never);
              }}
              style={styles.viewAllButton}
            >
              Ver todas mis materias
            </Button>
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
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
  viewAllButton: {
    marginTop: 8,
  },
});
