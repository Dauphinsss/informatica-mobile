import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

export const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    cardContent: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
      position: "relative",
    },
    autorNombre: {
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    fecha: {
      position: "absolute",
      right: 0,
      top: 0,
      textAlign: "right",
      opacity: 0.7,
      maxWidth: 80,
    },
    autorContainer: {
      flex: 1,
      marginLeft: 12,
    },
    titulo: {
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.onSurface,
      fontSize: 16,
      paddingRight: 90,
      lineHeight: 20,
    },
    descripcion: {
      opacity: 0.8,
      marginBottom: 12,
      color: theme.colors.onSurface,
      fontSize: 14,
      paddingRight: 20,
    },
    materiaNombre: {
      marginTop: 12,
      marginBottom: 8,
      color: theme.colors.onSurface,
      fontWeight: "500",
      fontSize: 15,
      textAlign: 'center',
      alignSelf: 'center',
      width: '100%',
    },
    statsContainer: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
    },
    statChip: {
      backgroundColor: "transparent",
      borderWidth: 0,
      elevation: 0,
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.colors.background,
      position: 'relative',
    },
    searchbarWrapper: {
      flex: 1,
    },
    searchbar: {
      borderRadius: 12,
      marginRight: 4,
      backgroundColor: theme.colors.background,
      elevation: 0,
      borderWidth: 0,
    },
    searchbarInput: {
      fontSize: 15,
      color: theme.colors.onBackground,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    loadingIndicator: {
      marginTop: 32,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 32,
    },
    // Estilos para FiltroFlotante
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