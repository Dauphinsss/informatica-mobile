import { Dimensions, StyleSheet } from "react-native";
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
      paddingHorizontal: "8%",
      paddingVertical: 32,
    },
    loadingText: {
      textAlign: "center",
      opacity: 0.7,
      marginTop: 16,
      color: theme.colors.onBackground,
    },
    headerCard: {
      marginHorizontal: "4%",
      marginVertical: 16,
      marginBottom: 12,
      elevation: 2,
      borderRadius: 12,
    },
    autorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 4,
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
    },
    descripcion: {
      lineHeight: 24,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    statChip: {
      backgroundColor: "transparent",
      borderWidth: 0,
      elevation: 0,
    },
    statText: {
      color: theme.colors.onSurfaceVariant,
    },
    archivosContainer: {
      marginHorizontal: "4%",
      marginBottom: 12,
    },
    archivosTitle: {
      fontWeight: "bold",
      marginBottom: 12,
    },
    archivosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      justifyContent: "flex-start",
    },
    archivoCard: {
      width: cardWidth,
      minWidth: 140,
      maxWidth: "48%",
      padding: 12,
      elevation: 2,
      position: "relative",
      overflow: "visible",
    },
    archivoIconContainer: {
      alignItems: "center",
      paddingVertical: 16,
    },
    archivoInfo: {
      alignItems: "center",
      marginTop: 8,
      paddingHorizontal: "5%",
    },
    archivoNombre: {
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 4,
    },
    archivoTamano: {
      opacity: 0.7,
      fontSize: 12,
      textAlign: "center",
    },
    downloadButton: {
      position: "absolute",
      top: 0,
      right: 0,
      margin: 0,
      zIndex: 10,
    },
    
    // Comentarios
    comentariosCard: {
      marginHorizontal: "4%",
      marginVertical: 16,
      marginTop: 12,
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