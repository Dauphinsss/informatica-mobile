import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, disabled = false }: PaginationProps) {
  const { theme } = useTheme();

  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
    
      if (currentPage > 2) {
        pages.push('ellipsis');
      }
      
      if (currentPage > 1 && currentPage !== 2) {
        pages.push(currentPage - 1);
      }
      
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage);
      }
      
      if (currentPage < totalPages && currentPage !== totalPages - 1) {
        pages.push(currentPage + 1);
      }
      
      if (currentPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = generatePageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (!disabled && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      <View style={styles.paginationWrapper}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentPage === 1 || disabled}
          style={[
            styles.navButton,
            styles.navAbsoluteLeft,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
            (currentPage === 1 || disabled) && styles.navButtonDisabled,
          ]}
        >
          <IconButton
            icon="chevron-left"
            size={20}
            iconColor={currentPage === 1 || disabled ? theme.colors.onSurfaceDisabled : theme.colors.primary}
            style={{ margin: 0 }}
          />
        </TouchableOpacity>

        <View style={styles.pagesContainer}>
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <View key={`ellipsis-${index}`} style={styles.ellipsis}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    ...
                  </Text>
                </View>
              );
            }

            const isActive = page === currentPage;

            return (
              <TouchableOpacity
                key={page}
                onPress={() => handlePageClick(page)}
                disabled={disabled || isActive}
                style={[
                  styles.pageButton,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                    borderColor: isActive ? theme.colors.primary : theme.colors.outline,
                  },
                  disabled && !isActive && styles.pageButtonDisabled,
                ]}
              >
                <Text
                  variant="bodyMedium"
                  style={{
                    color: isActive ? theme.colors.onPrimary : theme.colors.onSurface,
                    fontWeight: isActive ? 'bold' : '500',
                  }}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentPage === totalPages || disabled}
          style={[
            styles.navButton,
            styles.navAbsoluteRight,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
            (currentPage === totalPages || disabled) && styles.navButtonDisabled,
          ]}
        >
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={currentPage === totalPages || disabled ? theme.colors.onSurfaceDisabled : theme.colors.primary}
            style={{ margin: 0 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  paginationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingHorizontal: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 0,
  },
  navAbsoluteLeft: {
    position: 'absolute',
    left: 8,
    zIndex: 2,
  },
  navAbsoluteRight: {
    position: 'absolute',
    right: 8,
    zIndex: 2,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  pagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 48,
    maxWidth: '72%',
  },
  pageButton: {
    minWidth: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  ellipsis: {
    width: 24,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
});