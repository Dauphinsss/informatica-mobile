import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Card, Divider, List, Text } from "react-native-paper";

export default function AdminScreen() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "usuarios", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Panel Admin" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.welcomeText}>
              Panel de Administración
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Bienvenido, {userData?.nombre || "Admin"}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Gestión del Sistema
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>
          <List.Item
            title="Materias"
            description="Gestionar materias y cursos"
            left={(props) => <List.Icon {...props} icon="book-open-variant" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Usuarios"
            description="Administrar usuarios del sistema"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Reportes"
            description="Ver estadísticas y reportes"
            left={(props) => <List.Icon {...props} icon="chart-bar" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <List.Item
            title="Denuncias"
            description="Gestionar denuncias y moderación"
            left={(props) => <List.Icon {...props} icon="alert-octagon" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
        </Card>

        <Card style={[styles.card, { marginBottom: 32 }]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actividad Reciente
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>

          <List.Section>
            <List.Subheader>Denuncias Recientes</List.Subheader>
            <List.Item
              title="No hay denuncias recientes"
              description="Las denuncias de usuarios aparecerán aquí"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
          </List.Section>

          <Divider />

          <List.Section>
            <List.Subheader>Cuentas Suspendidas</List.Subheader>
            <List.Item
              title="No hay cuentas suspendidas"
              description="Las suspensiones aparecerán aquí"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
          </List.Section>

          <Divider />

          <List.Section>
            <List.Subheader>Publicaciones Recientes</List.Subheader>
            <List.Item
              title="No hay publicaciones recientes"
              description="Las publicaciones aparecerán aquí"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
          </List.Section>
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
  welcomeText: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
});
