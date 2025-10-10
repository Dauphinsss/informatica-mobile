 import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },  
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
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
  },
  cardAuthor: {
    opacity: 0.7,
    marginBottom: 2,
  },
  cardDate: {
    opacity: 0.6,
    marginBottom: 8,
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
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  modalCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  publicacionTitulo: {
    fontWeight: 'bold',
    marginTop: 3,
    marginBottom: 3,
  },
  publicacionAutor: {
    opacity: 0.7,
    marginTop: 4,
  },
  publicacionContenido: {
    marginTop: 8,
    opacity: 0.8,
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
  },
  closeButton: {
    marginTop: 16,
  },
});

export default styles;