import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, IconButton, Card, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GeneralStatDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  total: number;
  current: number;
  previous: number;
  percentageChange: number;
}

export default function GeneralStatDetailModal({
  visible,
  onDismiss,
  title,
  total,
  current,
  previous,
  percentageChange,
}: GeneralStatDetailModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getChangeColor = (change: number) => {
    if (change > 0) return theme.colors.primary;
    if (change < 0) return theme.colors.error;
    return theme.colors.onSurfaceVariant;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surface, paddingTop: insets.top}]}> 
          <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>

          <IconButton
            icon="close"
            onPress={onDismiss}
            size={20}
            style={[styles.closeButton, { top: 6, right: 6 }]}
            accessibilityLabel="Cerrar"
          />
        </View>

        <View style={styles.content}>
        <Card style={styles.card}>
            <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
                Total en el Sistema
            </Text>
            <Text variant="displaySmall" style={styles.mainNumber}>
                {total.toLocaleString()}
            </Text>
            </Card.Content>
        </Card>

        <View style={styles.row}>
            <Card style={[styles.card, styles.sideCard]}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                Últimos 30 Días
                </Text>
                <Text variant="displaySmall" style={styles.mainNumber}>
                {current.toLocaleString()}
                </Text>
            </Card.Content>
            </Card>

            <Card style={[styles.card, styles.sideCard]}>
            <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                30 Días Previos
                </Text>
                <Text variant="displaySmall" style={styles.mainNumber}>
                {previous.toLocaleString()}
                </Text>
            </Card.Content>
            </Card>
        </View>

        <Card style={styles.card}>
            <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
                Comparación de Períodos
            </Text>
            <View style={styles.comparisonRow}>
                <Text 
                variant="displaySmall" 
                style={[styles.percentageText, { color: getChangeColor(percentageChange) }]}
                >
                {getChangeIcon(percentageChange)} {Math.abs(percentageChange)}%
                </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {percentageChange > 0 && `Aumento del ${percentageChange}% respecto al período anterior`}
                {percentageChange < 0 && `Disminución del ${Math.abs(percentageChange)}% respecto al período anterior`}
                {percentageChange === 0 && 'Sin cambios respecto al período anterior'}
            </Text>
            </Card.Content>
        </Card>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 8,
    borderRadius: 10,
    maxHeight: '88%',
    padding: 0,
    position: 'relative',
  },
  scrollView: {
    maxHeight: '90%',
  },
  content: {
    padding: 10,
  },
  card: {
    marginBottom: 6,
  },
  cardTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  mainNumber: {
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageText: {
    fontWeight: 'bold',
  },
  header: {
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
    alignSelf: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    margin: 0,
    backgroundColor: 'transparent',
    zIndex: 20,
    elevation: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  sideCard: {
    flex: 1,
    marginHorizontal: 6,
  },
});