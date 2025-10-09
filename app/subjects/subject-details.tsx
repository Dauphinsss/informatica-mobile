import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Card, Chip, Divider, FAB, List, Searchbar, Text } from 'react-native-paper';
import { Material, Subject, getMaterialsBySubject } from './mock-subjects';

const SubjectDetails = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const subject = (route.params as any)?.subject as Subject;

  useEffect(() => {
    if (subject) {
      const subjectMaterials = getMaterialsBySubject(subject.id);
      setMaterials(subjectMaterials);
      setFilteredMaterials(subjectMaterials);
    }
  }, [subject]);

  useEffect(() => {
    let filtered = materials;

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (selectedType) {
      filtered = filtered.filter(material => material.type === selectedType);
    }

    setFilteredMaterials(filtered);
  }, [searchQuery, selectedType, materials]);

  const getMaterialTypes = () => {
    const types = [...new Set(materials.map(material => material.type))];
    return types;
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'pdf': return 'file-pdf-box';
      case 'document': return 'file-document';
      case 'exam': return 'file-question';
      case 'book': return 'book';
      case 'presentation': return 'presentation';
      default: return 'file';
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'pdf': return '#d32f2f';
      case 'document': return '#1976d2';
      case 'exam': return '#f57c00';
      case 'book': return '#388e3c';
      case 'presentation': return '#7b1fa2';
      default: return '#616161';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'document': return 'Documento';
      case 'exam': return 'Examen';
      case 'book': return 'Libro';
      case 'presentation': return 'Presentación';
      default: return 'Archivo';
    }
  };

  const handleMaterialPress = (material: Material) => {
    Alert.alert(
      material.title,
      `Tipo: ${getTypeLabel(material.type)}\nSubido por: ${material.uploadedBy}\nTamaño: ${material.size}\nDescargas: ${material.downloadCount}\n\n${material.description || 'Sin descripción'}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descargar', onPress: () => handleDownload(material) }
      ]
    );
  };

  const handleDownload = (material: Material) => {
    Alert.alert('Descarga simulada', `Se descargaría: ${material.title}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
  };

  if (!subject) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text>No se pudo cargar la información de la materia</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subject.name} />
        <Appbar.Action icon="information" onPress={() => 
          Alert.alert('Información', `Código: ${subject.code}\nProfesor: ${subject.professor}\nSemestre: ${subject.semester}\n\n${subject.description}`)
        } />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Información de la materia */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.subjectTitle}>
              {subject.name}
            </Text>
            <Text variant="bodyMedium" style={styles.subjectCode}>
              {subject.code} • Prof. {subject.professor}
            </Text>
            <Text variant="bodySmall" style={styles.subjectDescription}>
              {subject.description}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={styles.statNumber}>
                  {materials.length}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Materiales
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={styles.statNumber}>
                  {materials.reduce((sum, material) => sum + material.downloadCount, 0)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Descargas
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleMedium" style={styles.statNumber}>
                  {subject.semester}°
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Semestre
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Barra de búsqueda */}
        <Searchbar
          placeholder="Buscar materiales..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        {/* Filtros por tipo */}
        {getMaterialTypes().length > 0 && (
          <View style={styles.filtersContainer}>
            <Text variant="titleSmall" style={styles.filterTitle}>Filtrar por tipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              <Chip
                selected={selectedType === null}
                onPress={() => setSelectedType(null)}
                style={styles.chip}
              >
                Todos
              </Chip>
              {getMaterialTypes().map(type => (
                <Chip
                  key={type}
                  selected={selectedType === type}
                  onPress={() => setSelectedType(type)}
                  style={styles.chip}
                >
                  {getTypeLabel(type)}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista de materiales */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Materiales Disponibles
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>

          {filteredMaterials.length === 0 ? (
            <Card.Content>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="file-outline" size={64} color="#ccc" />
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {searchQuery || selectedType 
                    ? 'No se encontraron materiales con los filtros aplicados'
                    : 'No hay materiales disponibles en esta materia'
                  }
                </Text>
                {(searchQuery || selectedType) && (
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
            filteredMaterials.map((material, index) => (
              <View key={material.id}>
                <List.Item
                  title={material.title}
                  description={`${getTypeLabel(material.type)} • ${material.size} • ${material.downloadCount} descargas\nSubido por ${material.uploadedBy} • ${material.uploadDate}`}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={getMaterialIcon(material.type)}
                      color={getMaterialColor(material.type)}
                    />
                  )}
                  right={props => <List.Icon {...props} icon="download" />}
                  onPress={() => handleMaterialPress(material)}
                  style={styles.listItem}
                />
                {index < filteredMaterials.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* FAB para subir material (funcionalidad futura) */}
      <FAB
        icon="upload"
        style={styles.fab}
        onPress={() => Alert.alert('Próximamente', 'Función para subir materiales')}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginBottom: 16,
  },
  subjectTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subjectCode: {
    opacity: 0.7,
    marginBottom: 8,
  },
  subjectDescription: {
    opacity: 0.6,
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

export default SubjectDetails;