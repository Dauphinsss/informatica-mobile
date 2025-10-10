import { auth, db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, Chip, Searchbar, Surface, Text } from "react-native-paper";
import { getEnrolledSubjects, Subject } from "../subjects/mock-subjects";

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const user = auth.currentUser;

  // Colores temporales para los fondos de las tarjetas
  const subjectColors = [
    { bg: '#1976d2', accent: '#0d47a1' },
    { bg: '#388e3c', accent: '#1b5e20' },
    { bg: '#f57c00', accent: '#ef6c00' },
    { bg: '#7b1fa2', accent: '#4a148c' },
    { bg: '#d32f2f', accent: '#b71c1c' },
    { bg: '#303f9f', accent: '#1a237e' },
  ];

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "usuarios", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      });
      return () => unsubscribe();
    }
  }, [user, setUserData]);

  useEffect(() => {
    const subjects = getEnrolledSubjects();
    setEnrolledSubjects(subjects);
    setFilteredSubjects(subjects);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = enrolledSubjects.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects(enrolledSubjects);
    }
  }, [searchQuery, enrolledSubjects]);

  const getSubjectIcon = (code: string) => {
    if (code.startsWith('INF')) return 'laptop';
    if (code.startsWith('MAT')) return 'calculator';
    if (code.startsWith('FIS')) return 'atom';
    return 'book-open-variant';
  };

  { /* Futura funcionalidad para ingresar al contenido de la materia */ }
  const handleSubjectPress = (subject: Subject) => {
    Alert.alert(
      subject.name,
      `${subject.code}\n\n${subject.description}\n\nMateriales disponibles: ${subject.materialsCount}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver Materiales', onPress: () => Alert.alert('Próximamente', 'Funcionalidad en desarrollo') }
      ]
    );
  };

  const getTotalMaterials = () => {
    return enrolledSubjects.reduce((total, subject) => total + subject.materialsCount, 0);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Mis Materias" />
        <Appbar.Action icon="plus" onPress={() => Alert.alert('Próximamente', 'Función para inscribirse a materias')} />
      </Appbar.Header>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header con saludo y estadísticas */}
        <Surface style={styles.headerCard} elevation={2}>
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.greeting}>
              ¡Hola, {user.displayName?.split(" ")[0] || userData?.nombre || "Usuario"}!
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Bienvenido, a tu plataforma de materiales académicos
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {enrolledSubjects.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materias
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={styles.statNumber}>
                  {getTotalMaterials()}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materiales
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar en mis materias..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon="magnify"
          clearIcon="close"
        />

        {/* Grid de materias estilo Classroom */}
        <View style={styles.subjectsGrid}>
          {filteredSubjects.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="book-outline" size={64} color="#9e9e9e" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  {searchQuery ? 'No se encontraron materias' : 'No tienes materias inscritas'}
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Intenta buscar con otros términos' 
                    : 'Inscríbete a materias para acceder a sus materiales'
                  }
                </Text>
                {searchQuery && (
                  <Button mode="outlined" onPress={() => setSearchQuery('')} style={styles.clearButton}>
                    Limpiar búsqueda
                  </Button>
                )}
              </View>
            </Surface>
          ) : (
            filteredSubjects.map((subject, index) => {
              const colorScheme = subjectColors[index % subjectColors.length];
              return (
                <TouchableOpacity
                  key={subject.id}
                  onPress={() => handleSubjectPress(subject)}
                  activeOpacity={0.7}
                >
                  <Surface style={styles.subjectCard} elevation={3}>
                    {/* Header colorido estilo Classroom */}
                    <View style={[styles.cardHeader, { backgroundColor: colorScheme.bg }]}>
                      <View style={styles.cardHeaderContent}>
                        <View style={styles.subjectTitleContainer}>
                          <Text variant="titleMedium" style={styles.subjectTitle}>
                            {subject.name}
                          </Text>
                          <Text variant="bodySmall" style={styles.subjectCode}>
                            {subject.code}
                          </Text>
                        </View>
                        <MaterialCommunityIcons 
                          name={getSubjectIcon(subject.code)} 
                          size={24} 
                          color="white" 
                          style={styles.subjectIcon}
                        />
                      </View>
                      
                      {/* Patrón decorativo */}
                      <View style={[styles.decorativePattern, { backgroundColor: colorScheme.accent }]} />
                    </View>

                    {/* Contenido de la card */}
                    <View style={styles.cardContent}>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.materialsInfo}>
                          <MaterialCommunityIcons name="file-multiple" size={16} color="#666" />
                          <Text variant="bodySmall" style={styles.materialsCount}>
                            {subject.materialsCount} materiales
                          </Text>
                        </View>
                        
                        <Chip 
                          icon="school" 
                          style={[styles.semesterChip, { backgroundColor: `${colorScheme.bg}20` }]}
                          textStyle={{ color: colorScheme.bg, fontSize: 12 }}
                        >
                          {subject.semester}° Sem
                        </Chip>
                      </View>
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerCard: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  headerContent: {
    padding: 20,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  searchbar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  subjectsGrid: {
    gap: 12,
  },
  subjectCard: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  cardHeader: {
    height: 120,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  subjectTitleContainer: {
    flex: 1,
  },
  subjectTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 18,
  },
  subjectCode: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  subjectIcon: {
    marginLeft: 12,
  },
  decorativePattern: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  cardContent: {
    padding: 16,
  },
  professorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  professorName: {
    marginLeft: 6,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  materialsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materialsCount: {
    marginLeft: 6,
    color: '#666',
  },
  semesterChip: {
    height: 28,
  },
  emptyCard: {
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 32,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  actionCard: {
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: 'white',
  },
  card: {
    marginBottom: 16,
  },
  legacyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  divider: {
    marginVertical: 8,
  },
  imagePlaceholder: {
    width: 50,
    height: 50, 
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    fontWeight: "bold",
    color: "white",
  },
  sectionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  subjectInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryTitle: {
    fontWeight: "bold",
  },
  textContent: {
    marginLeft: 12,
  },
  viewAllButton: {
    marginTop: 8,
  },
});
