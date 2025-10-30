import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Card, Divider, Text } from "react-native-paper";

// Definir el tipo de navegación para el stack de admin
type AdminStackParamList = {
  Admin: undefined;
  ManageUsers: undefined;
  Reports: undefined;
  ManageSubjects: undefined;
};

type AdminScreenNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "Admin"
>;

export default function AdminScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<AdminScreenNavigationProp>();

  // Estados para estadísticas
  const [totalMaterias, setTotalMaterias] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalDenuncias, setTotalDenuncias] = useState(0);
  const [denunciasPendientes, setDenunciasPendientes] = useState(0);

  // Obtener estadísticas en tiempo real
  useEffect(() => {
    // Contar materias
    const materiasRef = collection(db, "materias");
    const unsubMaterias = onSnapshot(materiasRef, (snapshot) => {
      setTotalMaterias(snapshot.size);
    });

    // Contar usuarios
    const usuariosRef = collection(db, "usuarios");
    const unsubUsuarios = onSnapshot(usuariosRef, (snapshot) => {
      setTotalUsuarios(snapshot.size);
    });

    // Contar denuncias totales
    const denunciasRef = collection(db, "reportes");
    const unsubDenuncias = onSnapshot(denunciasRef, (snapshot) => {
      setTotalDenuncias(snapshot.size);
    });

    // Contar denuncias pendientes
    const denunciasPendientesQuery = query(
      collection(db, "reportes"),
      where("estado", "==", "pendiente")
    );
    const unsubPendientes = onSnapshot(denunciasPendientesQuery, (snapshot) => {
      setDenunciasPendientes(snapshot.size);
    });

    return () => {
      unsubMaterias();
      unsubUsuarios();
      unsubDenuncias();
      unsubPendientes();
    };
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Panel de Administración" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título para las tarjetas */}
        <Text variant="titleMedium" style={styles.mainTitle}>
          Gestión del Sistema
        </Text>

        {/* Grid de cards con estadísticas */}
        <View style={styles.statsGrid}>
          {/* Card de Materias */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageSubjects")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="displaySmall" style={styles.statNumber}>
                    {totalMaterias}
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Materias
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.chevron}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Card de Usuarios */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ManageUsers")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="displaySmall" style={styles.statNumber}>
                    {totalUsuarios}
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Usuarios
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.chevron}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Segunda fila de cards */}
        <View style={styles.statsGrid}>
          {/* Card de Denuncias */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Reports")}
          >
            <Card elevation={2} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="alert-octagon"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="displaySmall" style={styles.statNumber}>
                    {denunciasPendientes}
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Denuncias
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {totalDenuncias} total
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.chevron}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Card de Reportes/Estadísticas */}
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            disabled
          >
            <Card elevation={2} style={[styles.card, styles.disabledCard]}>
              <Card.Content style={styles.cardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chart-bar"
                    size={32}
                    color={theme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.statContent}>
                  <Text variant="bodyLarge" style={[styles.statLabel, styles.comingSoon]}>
                    Próximamente
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[styles.subLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Estadísticas
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Actividad Reciente */}
        <View style={styles.activitySection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Actividad Reciente
          </Text>

          <Card elevation={1} style={styles.activityCard}>
            <Card.Content>
              <View style={styles.activityItem}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.activityText, { color: theme.colors.onSurfaceVariant }]}
                >
                  No hay actividad reciente
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>
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
  mainTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    height: 200,
  },
  cardContent: {
    paddingVertical: 20,
    alignItems: "center",
    position: "relative",
    height: "100%",
    justifyContent: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statContent: {
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: "500",
  },
  subLabel: {
    marginTop: 4,
    opacity: 0.6,
  },
  chevron: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  disabledCard: {
    opacity: 0.6,
  },
  comingSoon: {
    marginTop: 12,
    marginBottom: 4,
  },
  activitySection: {
    marginTop: 8,
    marginBottom: 32,
  },
  activityCard: {
    borderRadius: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityText: {
    flex: 1,
    fontStyle: "italic",
  },
});
