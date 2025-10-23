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
      paddingVertical: 16,
    },
    card: {
      marginBottom: 16,
    },
    label: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    input: {
      marginTop: 16,
      backgroundColor: theme.colors.surface,
    },
    archivosHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    archivosTitle: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    noArchivos: {
      textAlign: "center",
      opacity: 0.6,
      paddingVertical: 16,
      color: theme.colors.onSurface,
    },
    archivoCard: {
      marginTop: 8,
      backgroundColor: theme.colors.surfaceVariant,
      elevation: 0,
    },
    archivoContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingVertical: 8,
      gap: 8,
    },
    archivoInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      gap: 8,
      minWidth: 0,
    },
    archivoIcon: {
      margin: 0,
      flexShrink: 0,
    },
    archivoTexto: {
      flex: 1,
      minWidth: 0,
      paddingRight: 4,
    },
    archivoNombre: {
      fontWeight: "500",
      color: theme.colors.onSurface,
      marginBottom: 8,
      flexWrap: "wrap",
    },
    archivoMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    tipoChip: {
      alignSelf: "flex-start",
      flexShrink: 0,
    },
    archivoTamano: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    progressBar: {
      height: 3,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
    },
    publicarButton: {
      marginTop: 8,
      marginBottom: 24,
    },
  });

export default getStyles;