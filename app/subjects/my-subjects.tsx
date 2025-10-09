import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Divider, List, Searchbar, Text } from 'react-native-paper';
import { Subject, getEnrolledSubjects } from './mock-subjects';

const MySubjects = () => {
  const [subjects] = useState<Subject[]>(getEnrolledSubjects());
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectIcon = (code: string) => {
    if (code.startsWith('INF')) return 'laptop';
    if (code.startsWith('MAT')) return 'calculator';
    return 'book-open-variant';
  };

  const handleSubjectPress = (subject: Subject) => {
    Alert.alert(
      subject.name,
      `Código: ${subject.code}\nProfesor: ${subject.professor}\nMateriales: ${subject.materialsCount}\n\n${subject.description}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver Materiales', onPress: () => Alert.alert('Próximamente', 'Funcionalidad de materiales en desarrollo') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Mis Materias" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Estadísticas */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Resumen
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {subjects.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materias
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {subjects.reduce((sum, subject) => sum + subject.materialsCount, 0)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materiales
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar materias..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

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
                  {searchQuery 
                    ? 'No se encontraron materias'
                    : 'No tienes materias inscritas'
                  }
                </Text>
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
  searchbar: {
    marginBottom: 16,
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
});

export default MySubjects;