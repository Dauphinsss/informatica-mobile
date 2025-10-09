import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Chip, Divider, FAB, List, Searchbar, Text } from 'react-native-paper';
import { Subject, getEnrolledSubjects } from './mock-subjects';

const EnrolledSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const enrolledSubjects = getEnrolledSubjects();
    setSubjects(enrolledSubjects);
    setFilteredSubjects(enrolledSubjects);
  }, []);

  useEffect(() => {
    let filtered = subjects;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.professor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por semestre
    if (selectedSemester !== null) {
      filtered = filtered.filter(subject => subject.semester === selectedSemester);
    }

    setFilteredSubjects(filtered);
  }, [searchQuery, selectedSemester, subjects]);

  const getUniqueSesters = () => {
    const semesters = [...new Set(subjects.map(subject => subject.semester))];
    return semesters.sort((a, b) => a - b);
  };

  const getSubjectIcon = (code: string) => {
    if (code.startsWith('INF')) return 'laptop';
    if (code.startsWith('MAT')) return 'calculator';
    if (code.startsWith('FIS')) return 'atom';
    return 'book-open-variant';
  };

  const handleSubjectPress = (subject: Subject) => {
    // Navegación simple por ahora 
    console.log('Navegar a detalles de materia:', subject.name);
    // navigation.navigate('SubjectDetails' as never, { subject } as never);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSemester(null);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Mis Materias" />
        <Appbar.Action icon="filter-variant" onPress={() => Alert.alert('Filtros', 'Funcionalidad próximamente')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar materias..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          icon="magnify"
          clearIcon="close"
        />

        {/* Filtros por semestre */}
        <View style={styles.filtersContainer}>
          <Text variant="titleSmall" style={styles.filterTitle}>Filtrar por semestre:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            <Chip
              selected={selectedSemester === null}
              onPress={() => setSelectedSemester(null)}
              style={styles.chip}
            >
              Todos
            </Chip>
            {getUniqueSesters().map(semester => (
              <Chip
                key={semester}
                selected={selectedSemester === semester}
                onPress={() => setSelectedSemester(semester)}
                style={styles.chip}
              >
                {semester}° Semestre
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Estadísticas */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {filteredSubjects.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materias
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {filteredSubjects.reduce((sum, subject) => sum + subject.materialsCount, 0)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materiales
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de materias */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Materias Inscritas
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>

          {filteredSubjects.length === 0 ? (
            <Card.Content>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="book-outline" size={64} color="#ccc" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {searchQuery || selectedSemester !== null 
                    ? 'No se encontraron materias con los filtros aplicados'
                    : 'No tienes materias inscritas'
                  }
                </Text>
                {(searchQuery || selectedSemester !== null) && (
                  <Text 
                    variant="bodyMedium" 
                    style={styles.clearFiltersText}
                    onPress={clearFilters}
                  >
                    Limpiar filtros
                  </Text>
                )}
              </View>
            </Card.Content>
          ) : (
            filteredSubjects.map((subject, index) => (
              <View key={subject.id}>
                <List.Item
                  title={subject.name}
                  description={`${subject.code} • ${subject.professor} • ${subject.materialsCount} materiales`}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={getSubjectIcon(subject.code)}
                      color="#6200ea"
                    />
                  )}
                  right={props => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => handleSubjectPress(subject)}
                  style={styles.listItem}
                />
                {index < filteredSubjects.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* FAB para agregar materia (funcionalidad futura) */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Próximamente', 'Función para inscribirse a nuevas materias')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#6200ea',
  },
  statLabel: {
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  clearFiltersText: {
    textAlign: 'center',
    marginTop: 8,
    color: '#6200ea',
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ea',
  },
});

export default EnrolledSubjects;