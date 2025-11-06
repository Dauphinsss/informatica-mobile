// app/components/filters/PublicationFilters.tsx
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Text } from 'react-native-paper';

export type SortBy = 'fecha' | 'vistas' | 'likes' | 'comentarios'| 'semestre';
export type SortOrder = 'asc' | 'desc';

interface PublicationFiltersProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onFilterChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  theme: MD3Theme;
  styles?: any;
  showSemestreFilter?: boolean;
}

export const PublicationFilters: React.FC<PublicationFiltersProps> = ({
  sortBy,
  sortOrder,
  onFilterChange,
  theme,
  showSemestreFilter = false,
}) => {
  const baseFilterOptions: { key: SortBy; label: string }[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'vistas', label: 'Vistas' },
    { key: 'likes', label: 'Likes' },
    { key: 'comentarios', label: 'Comentarios' },
  ];

  let filterOptions = [...baseFilterOptions];

  if (showSemestreFilter) {
    filterOptions.splice(2, 0, { key: 'semestre', label: 'Semestre' });
  }

  const getChipLabel = (key: SortBy) => {
    const option = filterOptions.find(o => o.key === key);
    if (!option) return '';

    if (sortBy === key) {
      return `${option.label} ${sortOrder === 'desc' ? '▼' : '▲'}`;
    }
    return option.label;
  };

  const internalStyles = StyleSheet.create({
    container: {
      paddingBottom: 12,
      paddingHorizontal: 0,
    },
    scrollContent: {
      paddingHorizontal: 12,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    chip: {
      marginRight: 8,
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipSelected: {
      marginRight: 8,
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    chipTextSelected: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onPrimaryContainer,
    },
  });

  const handleChipPress = (key: SortBy) => {
    if (sortBy === key) {
      // Si ya está seleccionado, alternar el orden
      onFilterChange(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si no está seleccionado, seleccionarlo con el orden actual
      onFilterChange(key, sortOrder);
    }
  };

  return (
    <View style={internalStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={internalStyles.scrollContent}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => handleChipPress(option.key)}
            style={sortBy === option.key ? internalStyles.chipSelected : internalStyles.chip}
            activeOpacity={0.7}
          >
            <Text style={sortBy === option.key ? internalStyles.chipTextSelected : internalStyles.chipText}>
              {getChipLabel(option.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};