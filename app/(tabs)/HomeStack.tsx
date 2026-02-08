import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import MisPublicacionesScreen from "../profile/MisPublicacionesScreen";
import CreatePublicationScreen from "../subjects/CreatePublicationScreen";
import FileGalleryScreen from "../subjects/FileGalleryScreen";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";
import SubjectDetailScreen from "../subjects/SubjectDetailScreen";
import HomeScreen from "./index";
import NotificationsScreen from "./notifications";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
      <Stack.Screen
        name="CreatePublication"
        component={CreatePublicationScreen}
      />
      <Stack.Screen
        name="PublicationDetail"
        component={PublicationDetailScreen}
      />
      <Stack.Screen
        name="FileGallery"
        component={FileGalleryScreen}
        options={{
          headerShown: false,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="MisPublicacionesScreen"
        component={MisPublicacionesScreen}
      />
    </Stack.Navigator>
  );
}
