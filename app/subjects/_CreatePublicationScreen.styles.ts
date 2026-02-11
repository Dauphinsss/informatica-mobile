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
    archivosCard: {
      marginBottom: 10,
    },
    archivosCardContent: {
      paddingVertical: 10,
      paddingHorizontal: 8,
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
      marginBottom: 4,
    },
    archivosTitle: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
    noArchivos: {
      textAlign: "center",
      opacity: 0.6,
      paddingVertical: 8,
      color: theme.colors.onSurface,
    },
    archivosList: {
      marginTop: 0,
      marginBottom: 4,
      gap: 6,
    },
    archivoCard: {
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 0.5,
    },
    archivoContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      gap: 6,
    },
    archivoInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 8,
      minWidth: 0,
    },
    archivoLeading: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceVariant,
      flexShrink: 0,
    },
    archivoTexto: {
      flex: 1,
      minWidth: 0,
      paddingRight: 6,
    },
    archivoNombre: {
      fontWeight: "500",
      color: theme.colors.onSurface,
      marginBottom: 4,
      flexWrap: "wrap",
    },
    archivoFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      minHeight: 24,
    },
    archivoTamano: {
      opacity: 0.7,
      color: theme.colors.onSurface,
      fontSize: 13,
      minWidth: 58,
      flexShrink: 0,
    },
    archivoActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginLeft: "auto",
      flexShrink: 0,
    },
    archivoActionButton: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.9,
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
