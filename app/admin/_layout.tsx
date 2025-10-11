import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AdminScreen from "../(tabs)/admin";
import ManageSubjectsScreen from "./manage-subjects";
import ManageUsers from "./manage-users";
import ReportsScreen from "./ReportsScreen";

const Stack = createStackNavigator();

export default function AdminLayOut() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Ocultamos el header del stack porque cada pantalla maneja el suyo
      }}
    >
      <Stack.Screen
        name="AdminHome"
        component={AdminScreen}
        options={{
          title: "Panel Admin",
        }}
      />
      <Stack.Screen
        name="ManageSubjects"
        component={ManageSubjectsScreen}
        options={{ title: "Gestión de Materias" }}
      />
      <Stack.Screen
        name="ManageUsers"
        component={ManageUsers}
        options={{
          title: "Administrar Usuarios",
        }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: "Reportes",
        }}
      />
    </Stack.Navigator>
  );
}
