// app/components/filters/PublicationFilters.tsx
import React from 'react';
import { View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { IconButton, Text, TouchableRipple } from 'react-native-paper';

export type SortBy = 'fecha' | 'vistas' | 'likes' | 'comentarios'| 'semestre';
export type SortOrder = 'asc' | 'desc';

interface PublicationFiltersProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onFilterChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  theme: MD3Theme;
  styles: any;
  showSemestreFilter?: boolean;
}

export const PublicationFilters: React.FC<PublicationFiltersProps> = ({
  sortBy,
  sortOrder,
  onFilterChange,
  theme,
  styles,
  showSemestreFilter = false,
}) => {
  const [visible, setVisible] = React.useState(false);

  const baseFilterOptions: { key: SortBy; label: string }[] = [
    { key: 'fecha', label: 'Por fecha' },
    { key: 'vistas', label: 'Por vistas' },
    { key: 'likes', label: 'Por likes' },
    { key: 'comentarios', label: 'Por comentarios' },
  ];

  let filterOptions = [...baseFilterOptions];

  if (showSemestreFilter) {
    filterOptions.splice(2, 0, { key: 'semestre', label: 'Por semestre' });
  }

  return (
    <View style={styles.filtroContainer}>
      <IconButton
        icon="tune"
        size={28}
        onPress={() => setVisible(v => !v)}
        style={styles.filtroButton}
        iconColor={theme.colors.onBackground}
        accessibilityLabel="Abrir filtros"
      />
      {visible && (
        <View style={styles.filtroMenu}>
          {filterOptions.map((option) => (
            <TouchableRipple 
              key={option.key}
              onPress={() => { 
                onFilterChange(option.key, sortOrder); 
                setVisible(false); 
              }} 
              style={styles.filtroRipple}
            >
              <View style={sortBy === option.key ? styles.filtroItemActive : styles.filtroItem}>
                <Text style={sortBy === option.key ? styles.filtroTextActive : styles.filtroText}>
                  {option.label}
                </Text>
              </View>
            </TouchableRipple>
          ))}
          <TouchableRipple 
            onPress={() => { 
              onFilterChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc'); 
              setVisible(false); 
            }} 
            style={styles.filtroRipple}
          >
            <View style={styles.filtroItem}>
              <Text style={styles.filtroText}>
                {sortOrder === 'asc' ? 'Ascendente ▲' : 'Descendente ▼'}
              </Text>
            </View>
          </TouchableRipple>
        </View>
      )}
    </View>
  );
};