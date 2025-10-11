import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Appbar } from "react-native-paper";

export default function SubjectDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as {
    nombre?: string;
    id?: string;
    semestre?: number;
  };
  const subjectName = params?.nombre || "Materia";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={subjectName} />
      </Appbar.Header>

      <View style={styles.content}>{/* Contenido de la materia aquí */}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
