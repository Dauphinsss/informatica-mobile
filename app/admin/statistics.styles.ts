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
    sectionTitle: {
      fontWeight: "bold",
      marginBottom: 16,
      marginTop: 8,
      color: theme.colors.onBackground,
    },
    cardsGrid: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    cardHalf: {
      flex: 1,
    },
    cardFull: {
      marginBottom: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyText: {
      textAlign: "center",
      opacity: 0.7,
      marginTop: 12,
      color: theme.colors.onBackground,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 16,
      color: theme.colors.onBackground,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    errorText: {
      textAlign: "center",
      marginTop: 12,
      marginBottom: 24,
      color: theme.colors.error,
    },
    dividerSection: {
      marginVertical: 24,
    },
  });