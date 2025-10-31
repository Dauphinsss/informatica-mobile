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
    archivoCardWrapper: {
      width: cardWidth,
      minWidth: 140,
      maxWidth: "48%",
    },
    archivoCard: {
      width: "100%",
      height: cardWidth * 0.75,
      minHeight: 120,
      elevation: 2,
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
    },
    downloadButton: {
      position: "absolute",
      top: 4,
      right: 4,
      margin: 0,
      zIndex: 10,
      backgroundColor: "transparent",
      borderRadius: 20,
    },
    enlaceBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      zIndex: 10,
      height: 22,
    },
    fullPreviewContainer: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      overflow: "hidden",
    },
    fullPreviewImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.05)",
    },
    videoOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    textPreviewText: {
      fontFamily: "monospace",
      fontSize: 9,
      lineHeight: 13,
      color: theme.colors.onSurface,
      opacity: 0.8,
      padding: 8,
      width: "100%",
      height: "100%",
      textAlign: "left",
    },
    previewLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
    },
    iconFallbackContainer: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
    },
    archivoInfoContainer: {
      paddingTop: 8,
      paddingHorizontal: 4,
    },
    archivoInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 0,
    },
    archivoTitulo: {
      flex: 1,
      fontWeight: "500",
      color: theme.colors.onSurface,
      lineHeight: 18,
    },
    comentariosCard: {
      marginHorizontal: 8,
      marginBottom: 8,
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
    actionsCard: {
      marginHorizontal: 16,
    },
    comentariosHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    actionsDivider: {
      marginVertical: 0,
      paddingTop: 0,
      marginTop: 0,
      backgroundColor: theme.colors.outline,
    },
    likesCount: {
      marginTop: 8,
      fontWeight: "bold",
      color: theme.colors.onSurface,
    },
  });

export default getStyles;
