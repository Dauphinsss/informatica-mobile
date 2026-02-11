import { StyleSheet } from "react-native";
import { MD3Theme } from "react-native-paper";

const H_MARGIN = 16;
const THUMB = 48;

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
      marginTop: 12,
      marginBottom: 8,
      elevation: 2,
      borderRadius: 12,
    },
    headerCardContent: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      gap: 10,
    },
    autorContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    autorInfo: {
      flex: 1,
    },
    autorNombre: {
      fontWeight: "500",
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.onSurface,
    },
    fecha: {
      opacity: 0.7,
      marginTop: 1,
      fontSize: 11,
      color: theme.colors.onSurface,
    },
    divider: {
      marginVertical: 2,
    },
    titulo: {
      color: theme.colors.onSurface,
      fontWeight: "700",
      fontSize: 16,
      lineHeight: 23,
      letterSpacing: 0.1,
      marginBottom: 8,
    },
    descripcion: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 24,
      letterSpacing: 0.1,
      marginBottom: 12,
      opacity: 0.9,
    },
    statsRowWithDownload: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "nowrap",
      marginLeft: "auto",
      flexShrink: 1,
      alignItems: "center",
    },
    statsInlineItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    statsInlineText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 18,
    },
    archivosContainer: {
      marginHorizontal: H_MARGIN,
      marginBottom: 8,
    },
    archivosTitle: {
      fontWeight: "bold",
      marginBottom: 2,
    },
    archivosGrid: {
      flexDirection: "column",
      gap: 8,
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
      paddingHorizontal: 10,
      paddingVertical: 9,
      gap: 10,
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
      fontSize: 11,
    },
    openingProgressBar: {
      marginTop: 6,
      height: 3,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceVariant,
    },
    downloadingProgressBar: {
      marginTop: 6,
      height: 3,
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceVariant,
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
    downloadChip: {
      borderRadius: 999,
      backgroundColor: theme.colors.secondaryContainer,
      height: 32,
      justifyContent: "center",
      paddingHorizontal: 8,
      minWidth: 116,
      flexShrink: 0,
    },
    downloadChipText: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
      color: theme.colors.onSecondaryContainer,
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
      backgroundColor: theme.dark
        ? "rgba(0, 0, 0, 0.45)"
        : "rgba(255, 255, 255, 0.78)",
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
      backgroundColor: theme.dark
        ? "rgba(0, 0, 0, 0.45)"
        : "rgba(255, 255, 255, 0.78)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 25,
      borderRadius: 12,
    },
  });

export default getStyles;
