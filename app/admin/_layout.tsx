import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AdminScreen from "../(tabs)/admin";
import FileGalleryScreen from "../subjects/FileGalleryScreen";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";
import AllActivityScreen from "./AllActivityScreen";
import CreateSubjectScreen from "./create-subject";
import EditSubjectScreen from "./edit-subject";
import ManageSectionsScreen from "./manage-sections";
import ManageSubjectsScreen from "./manage-subjects";
import ManageTeachersScreen from "./manage-teachers";
import ManageUsers from "./manage-users";
import PendingPublicationsScreen from "./pending-publications";
import ReportsScreen from "./ReportsScreen";
import StatisticsStack from "./StatisticsStack";

const Stack = createStackNavigator();

export default function AdminLayOut() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        name="ManageTeachers"
        component={ManageTeachersScreen}
        options={{
          title: "Docentes",
        }}
      />
      <Stack.Screen
        name="ManageSections"
        component={ManageSectionsScreen}
        options={{
          title: "Secciones",
        }}
      />
      <Stack.Screen
        name="PendingPublications"
        component={PendingPublicationsScreen}
        options={{
          title: "Publicaciones pendientes",
        }}
      />
      <Stack.Screen
        name="PublicationDetail"
        component={PublicationDetailScreen}
        options={{
          title: "Detalle de publicación",
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
        component={StatisticsStack}
        options={{
          title: "Estadísticas",
        }}
      />
      <Stack.Screen
        name="AllActivity"
        component={AllActivityScreen}
        options={{
          title: "Actividad Reciente",
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
