import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

const H_MARGIN = 16;
const THUMB = 56;

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
      marginHorizontal: H_MARGIN,
      marginBottom: 12,
    },
    archivosTitle: {
      fontWeight: "bold",
      marginBottom: 12,
    },
    archivosGrid: {
      flexDirection: "column",
      gap: 10,
    },
    archivoCardWrapper: {
      width: "100%",
    },
    archivoCard: {
      width: "100%",
      elevation: 2,
      borderRadius: 12,
      overflow: "hidden",
      position: "relative",
    },
    archivoRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 12,
    },
    archivoThumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceVariant,
    },
    archivoMeta: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    archivoTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    archivoTitle: {
      flex: 1,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    archivoSubtitle: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.85,
      fontSize: 12,
    },
    archivoTrailing: {
      marginRight: -6,
    },
    addFileCard: {
      borderRadius: 12,
      elevation: 1,
      overflow: "hidden",
    },
    addFileRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 10,
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
    modalContent: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: "5%",
      paddingVertical: 20,
      marginHorizontal: "5%",
      marginVertical: 20,
      borderRadius: 12,
      maxHeight: "90%",
    },
    archivosHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      flexWrap: "wrap",
      gap: 8,
    },
    downloadAllButton: {
      borderRadius: 8,
    },
    downloadProgressOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 20,
      borderRadius: 12,
    },
    downloadProgressText: {
      color: theme.colors.onBackground,
      fontWeight: "bold",
      marginTop: 8,
      fontSize: 16,
    },
    imageLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 25,
      borderRadius: 12,
    },
    imageLoadingText: {
      color: theme.colors.primary,
      fontWeight: "bold",
      marginTop: 12,
      fontSize: 18,
    },
    iconLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 25,
      borderRadius: 12,
    },
  });

export default getStyles;
