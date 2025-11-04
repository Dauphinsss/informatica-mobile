import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Divider,
  List,
  Surface,
  Text,
} from "react-native-paper";

interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  semestre: number;
  estado: "active" | "inactive";
}

export default function AllSubjectsScreen() {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const subjectsCollection = collection(db, "materias");
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subject[];

      // Ordenar por semestre y nombre
      subjectsList.sort((a, b) => {
        if (a.semestre !== b.semestre) {
          return a.semestre - b.semestre;
        }
        return a.nombre.localeCompare(b.nombre);
      });

      // Filtrar solo materias activas
      const activeSubjects = subjectsList.filter((s) => s.estado === "active");
      setSubjects(activeSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Todas las Materias" />
      </Appbar.Header>

      {/* Contenido */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>
              Cargando materias...
            </Text>
          </View>
        ) : subjects.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, textAlign: "center" }}
            >
              No hay materias disponibles
            </Text>
          </Surface>
        ) : (
          <Surface style={styles.listCard} elevation={1}>
            <List.Section>
              {subjects.map((subject, index) => (
                <View key={subject.id}>
                  {index > 0 && <Divider />}
                  <List.Item
                    title={subject.nombre}
                    description={`Semestre ${subject.semestre}`}
                    left={(props) => (
                      <List.Icon {...props} icon="book-open-variant" />
                    )}
                    titleStyle={{ color: theme.colors.onSurface }}
                    descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                  />
                </View>
              ))}
            </List.Section>
          </Surface>
        )}
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  listCard: {
    borderRadius: 12,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 40,
  },
});
