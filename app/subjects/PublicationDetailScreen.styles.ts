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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    loadingText: {
      textAlign: "center",
      opacity: 0.7,
      marginTop: 16,
      color: theme.colors.onBackground,
    },
    headerCard: {
      margin: 16,
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    autorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.onPrimaryContainer,
    },
    autorInfo: {
      flex: 1,
    },
    autorNombre: {
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    fecha: {
      opacity: 0.7,
      marginTop: 2,
      color: theme.colors.onSurface,
    },
    divider: {
      marginVertical: 12,
    },
    titulo: {
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    descripcion: {
      lineHeight: 24,
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    statChip: {
      height: 28,
    },
    archivosCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    archivosTitle: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    archivoItem: {
      paddingVertical: 12,
    },
    archivoContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    archivoIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    archivoIcon: {
      margin: 0,
    },
    archivoInfo: {
      flex: 1,
    },
    archivoNombre: {
      fontWeight: "500",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    archivoMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    tipoChip: {
      height: 24,
    },
    archivoTamano: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    comentariosCard: {
      margin: 16,
      marginTop: 12,
      backgroundColor: theme.colors.surface,
      elevation: 1,
    },
    comentariosTitle: {
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    comentariosPlaceholder: {
      opacity: 0.6,
      textAlign: "center",
      paddingVertical: 16,
      color: theme.colors.onSurface,
    },
  });