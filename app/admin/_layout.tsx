import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AdminScreen from "../(tabs)/admin";
import FileGalleryScreen from "../subjects/FileGalleryScreen";
import ManageSubjectsScreen from "./manage-subjects";
import ManageUsers from "./manage-users";
import ReportsScreen from "./ReportsScreen";
import StatisticsScreen from "./statistics";
import CreateSubjectScreen from "./create-subject";
import EditSubjectScreen from "./edit-subject";

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
      <Stack.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: "Estadísticas",
        }}
      />
      <Stack.Screen
        name="FileGallery"
        component={FileGalleryScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="CreateSubject"
        component={CreateSubjectScreen}
        options={{ title: "Nueva Materia" }}
      />
      <Stack.Screen
        name="EditSubject"
        component={EditSubjectScreen}
        options={{ title: "Editar Materia" }}
      />
    </Stack.Navigator>
  );
}
