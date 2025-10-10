import React from 'react';
import { View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
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
  const theme = useTheme();

  return (
    <Card style={styles.subjectCard} mode='elevated'>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.subjectMainInfo}>
            <Text variant="titleMedium" style={styles.subjectName} numberOfLines={1}>
              {subject.nombre}
            </Text>
            <View style={styles.metaInfo}>
              {/* ✅ Usamos color primario del tema */}
              <View style={[styles.semesterBadge, { backgroundColor: theme.colors.primary }]}>
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
        
        <Text variant="bodyMedium" style={styles.subjectDescription} numberOfLines={2}>
          {subject.descripcion}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text variant="labelSmall" style={styles.createdDate}>
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
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  subjectMainInfo: {
    flex: 1,
  },
  subjectName: {
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
  },
  inactiveChip: {
    backgroundColor: '#ffebee',
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  subjectDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    paddingTop: 12,
  },
  createdDate: {
    fontStyle: 'italic',
  },
} as const;

export default SubjectCard;