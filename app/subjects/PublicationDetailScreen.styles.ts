import { StyleSheet, Dimensions } from "react-native";
import { MD3Theme } from "react-native-paper";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

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
      borderRadius: 12,
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
    
    // Estilos mejorados para archivos - estilo Classroom
    archivosContainer: {
      marginHorizontal: 16,
      marginBottom: 12,
    },
    archivosTitle: {
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.colors.onBackground,
    },
    archivosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    archivoCard: {
      width: cardWidth,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      elevation: 2,
      position: "relative",
      // Sombra más pronunciada estilo Classroom
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    archivoIconContainer: {
      alignItems: "center",
      paddingVertical: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 8,
    },
    archivoInfo: {
      alignItems: "center",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    archivoNombre: {
      fontWeight: "500",
      color: theme.colors.onSurface,
      textAlign: "center",
      marginBottom: 4,
    },
    archivoTamano: {
      opacity: 0.7,
      color: theme.colors.onSurface,
      fontSize: 12,
      textAlign: "center",
    },
    downloadButton: {
      position: "absolute",
      top: 4,
      right: 4,
      margin: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    
    // Comentarios
    comentariosCard: {
      margin: 16,
      marginTop: 12,
      backgroundColor: theme.colors.surface,
      elevation: 1,
      borderRadius: 12,
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