import React from 'react';
import { View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { Subject } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onToggleStatus: (subjectId: string, currentStatus: 'active' | 'inactive') => void;
  isUpdating?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ 
  subject, 
  onToggleStatus, 
  isUpdating = false 
}) => {
  return (
    <Card style={styles.subjectCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.subjectMainInfo}>
            <Text style={styles.subjectName} numberOfLines={1}>
              {subject.nombre}
            </Text>
            <View style={styles.metaInfo}>
              {/* Cambiar a color negro fijo */}
              <View style={[styles.semesterBadge, { backgroundColor: 'black' }]}>
                <Text style={styles.semesterText}>
                  Semestre {subject.semestre}
                </Text>
              </View>
              <Chip
                mode="outlined"
                onPress={() => !isUpdating && onToggleStatus(subject.id, subject.estado)}
                style={[
                  styles.statusChip,
                  subject.estado === 'active' 
                    ? styles.activeChip 
                    : styles.inactiveChip
                ]}
                disabled={isUpdating}
                textStyle={styles.chipText}
              >
                {isUpdating ? '...' : (subject.estado === 'active' ? 'Activa' : 'Inactiva')}
              </Chip>
            </View>
          </View>
        </View>
        
        <Text style={styles.subjectDescription} numberOfLines={2}>
          {subject.descripcion}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.createdDate}>
            Creada: {subject.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = {
  subjectCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 12,
  },
  subjectMainInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  semesterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  semesterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 28,
  },
  activeChip: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  inactiveChip: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  subjectDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  createdDate: {
    fontSize: 11,
    color: '#bdc3c7',
    fontStyle: 'italic',
  },
} as const;

export default SubjectCard;