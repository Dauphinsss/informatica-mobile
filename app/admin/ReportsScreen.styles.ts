 import { StyleSheet } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const getStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: "4%",
    paddingVertical: 16,
  },  
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: "4%",
    paddingVertical: 16,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: theme.colors.background,
  },

  filterButton: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.colors.onSurface,
  },
  cardAuthor: {
    opacity: 0.7,
    marginBottom: 2,
    color: theme.colors.onSurface,
  },
  cardDate: {
    opacity: 0.6,
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  leftChip: {
    flexShrink: 1,
    maxWidth: '60%',
  },
  rightChip: {
    flexShrink: 1,
    maxWidth: '35%',
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    color: theme.colors.onBackground,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: "5%",
    paddingVertical: 20,
    marginHorizontal: "5%",
    marginVertical: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  divider: {
    marginVertical: 8,
  },
  modalCard: {
    marginBottom: 12,
    backgroundColor: theme.colors.elevation.level1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
    color: theme.colors.onSurface,
  },
  publicacionTitulo: {
    fontWeight: 'bold',
    marginTop: 3,
    marginBottom: 3,
    color: theme.colors.onSurface,
  },
  publicacionAutor: {
    opacity: 0.7,
    marginTop: 4,
    color: theme.colors.onSurface,
  },
  publicacionContenido: {
    marginTop: 8,
    opacity: 0.8,
    color: theme.colors.onSurface,
  },
  masReportadores: {
    textAlign: 'center',
    opacity: 0.7,
  },
  accionesContainer: {
    marginTop: 16,
  },
  actionButton: {
    marginTop: 12,
  },
  buttonSubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
    color: theme.colors.onSurface,
  },
  closeButton: {
    marginTop: 16,
  },
});

export default getStyles;