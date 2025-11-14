// src/components/skeletons/PublicationDetailSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

// Skeleton atómico con animación mejorada
const SkeletonElement: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = '100%', height = 16, borderRadius = 4, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const theme = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

// Skeleton para el header de la publicación
const PublicationHeaderSkeleton: React.FC = () => {
  const theme = useTheme();
  
  return (
    <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
      {/* Autor info */}
      <View style={styles.autorContainer}>
        <SkeletonElement width={48} height={48} borderRadius={24} />
        <View style={styles.autorInfo}>
          <SkeletonElement width="70%" height={20} />
          <SkeletonElement width="50%" height={14} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.colors.surfaceVariant }]} />

      {/* Título y descripción */}
      <SkeletonElement height={28} borderRadius={6} />
      <SkeletonElement height={18} style={{ marginTop: 12 }} />
      <SkeletonElement width="90%" height={18} style={{ marginTop: 4 }} />
      <SkeletonElement width="80%" height={18} style={{ marginTop: 4 }} />
      <SkeletonElement width="60%" height={18} style={{ marginTop: 4 }} />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <SkeletonElement width={32} height={32} borderRadius={16} />
        </View>
        <View style={styles.statItem}>
          <SkeletonElement width={32} height={32} borderRadius={16} />
        </View>
        <View style={styles.statItem}>
          <SkeletonElement width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
};

// Skeleton para archivos individuales
const FileCardSkeleton: React.FC = () => {
  const theme = useTheme();
  const cardWidth = (width - 64) / 2; // 2 columnas con padding

  return (
    <View style={[styles.fileCard, { width: cardWidth }]}>
      {/* Preview del archivo */}
      <View style={styles.filePreview}>
        <SkeletonElement width={cardWidth - 24} height={cardWidth - 24} borderRadius={8} />
        
      </View>

      {/* Información del archivo */}
      <View style={styles.fileInfo}>
        <View style={styles.fileIconRow}>
          <SkeletonElement width={16} height={16} borderRadius={8} />
          <SkeletonElement width="80%" height={14} style={{ marginLeft: 6 }} />
        </View>
      </View>
    </View>
  );
};

// Skeleton para la sección de archivos
const FilesSectionSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={styles.filesSection}>
      {/* Header de archivos */}
      <View style={styles.filesHeader}>
        <SkeletonElement width="40%" height={24} />
        <SkeletonElement width={120} height={36} borderRadius={18} />
      </View>

      {/* Grid de archivos */}
      <View style={styles.filesGrid}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <FileCardSkeleton key={item} />
        ))}
      </View>
    </View>
  );
};

// Componente principal mejorado
export const PublicationDetailSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <PublicationHeaderSkeleton />
      <FilesSectionSkeleton />
      
      {/* Espacio adicional al final */}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  headerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  autorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filesSection: {
    marginTop: 8,
  },
  filesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  fileCard: {
    marginBottom: 16,
  },
  filePreview: {
    position: 'relative',
    alignItems: 'center',
  },
  downloadButtonSkeleton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  fileInfo: {
    marginTop: 8,
  },
  fileIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFileButtonSpace: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  bottomSpace: {
    height: 40,
  },
});