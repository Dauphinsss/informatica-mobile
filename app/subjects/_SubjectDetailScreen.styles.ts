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
      marginBottom: 12,
      elevation: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    avatarContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    autorNombre: {
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    fecha: {
      opacity: 0.7,
      color: theme.colors.onSurface,
    },
    titulo: {
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    descripcion: {
      opacity: 0.8,
      marginBottom: 12,
      color: theme.colors.onSurface,
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
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 80,
    },
    emptyText: {
      textAlign: "center",
      opacity: 0.7,
      marginTop: 8,
      color: theme.colors.onBackground,
    },
    emptySubtext: {
      textAlign: "center",
      opacity: 0.5,
      marginTop: 4,
      color: theme.colors.onBackground,
    },
    fab: {
      position: "absolute",
      marginHorizontal: "4%",
      marginVertical: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primaryContainer,
    },
  });
