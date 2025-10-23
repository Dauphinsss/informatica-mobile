import { StyleSheet, Dimensions } from "react-native";
import { MD3Theme } from "react-native-paper";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    viewerContainer: {
      flex: 1,
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
    },
    loadingContainer: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      backgroundColor: "#000",
    },
  });

export default getStyles;