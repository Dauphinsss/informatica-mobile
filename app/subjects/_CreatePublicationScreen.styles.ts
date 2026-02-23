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
    label: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    input: {
      marginTop: 16,
      backgroundColor: theme.colors.surface,
    },
    teacherSelectorWrap: {
      marginTop: 12,
      gap: 8,
      marginBottom: 8,
    },
    attachmentsHeaderWrap: {
      marginTop: 0,
      marginBottom: 8,
    },
    quickTagWrap: {
      marginTop: 6,
      gap: 4,
    },
    quickTagHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 22,
    },
    quickApplyContent: {
      height: 24,
    },
    quickApplyLabel: {
      marginVertical: 0,
      fontSize: 12,
    },
    teacherChipsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 1,
    },
    teacherChip: {
      height: 30,
      borderRadius: 15,
      paddingHorizontal: 10,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    archivosHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
      minHeight: 40,
    },
    archivosHeaderLeft: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      gap: 0,
    },
    archivosTitle: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      lineHeight: 24,
    },
    archivosSubtitle: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.8,
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
    archivoItem: {
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 12,
      overflow: "hidden",
    },
    archivoContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
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
    fileSectionMinimalRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    fileSectionLabel: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.9,
    },
    fileSectionPill: {
      minHeight: 30,
      borderRadius: 15,
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: "70%",
    },
    sectionOptionRow: {
      minHeight: 42,
      borderRadius: 10,
      paddingHorizontal: 12,
      justifyContent: "center",
      marginBottom: 6,
    },
    sectionDialog: {
      borderRadius: 20,
      overflow: "hidden",
    },
    sectionDialogScrollArea: {
      borderTopWidth: 0,
      borderBottomWidth: 0,
      marginHorizontal: 0,
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
      width: "100%",
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 4,
    },
    archivoErrorWrap: {
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    publicarButton: {
      marginTop: 8,
      marginBottom: 24,
    },
  });

export default getStyles;
