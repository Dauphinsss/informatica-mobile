import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: "4%",
      paddingBottom: 16,
    },
    card: {
      marginBottom: 12,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    avatarContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    autorNombre: {
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    fecha: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    titulo: {
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    descripcion: {
      opacity: 0.8,
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      justifyContent:"space-between"
    },
    statChip: {
      backgroundColor: "transparent",
      borderWidth: 0,
      elevation: 0,
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    emptyText: {
      textAlign: "center",
      opacity: 0.7,
      marginTop: 8,
      color: theme.colors.onBackground,
    },
    emptySubtext: {
      textAlign: "center",
      opacity: 0.5,
      marginTop: 4,
      color: theme.colors.onBackground,
    },
    fab: {
      position: "absolute",
      marginHorizontal: "4%",
      marginVertical: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primaryContainer,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.colors.background,
      position: 'relative',
    },
    searchbarWrapper: {
      flex: 1,
    },
    filtroContainer: {
      position: 'relative',
      marginLeft: 2,
    },
    filtroButton: {
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      zIndex: 11,
      borderWidth: 0,
    },
    filtroMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      minWidth: 160,
      zIndex: 100,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant || '#e0e0e0',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
    filtroRipple: {
      borderRadius: 0,
    },
    filtroItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 18,
    },
    filtroItemActive: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: theme.colors.secondaryContainer + '22',
    },
    filtroText: {
      fontSize: 15,
      fontWeight: '400',
      color: theme.colors.onBackground,
    },
    filtroTextActive: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    actionButton: {
      borderRadius: 16,
      overflow: 'hidden',
    }
  });

export default getStyles;