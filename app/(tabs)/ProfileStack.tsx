import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import MisPublicacionesScreen from "../profile/MisPublicacionesScreen";
import ProfileScreen from "./profile";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";
import FileGalleryScreen from "../subjects/FileGalleryScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="MisPublicacionesScreen"
        component={MisPublicacionesScreen}
      />
      <Stack.Screen
        name="PublicationDetail"
        component={PublicationDetailScreen}
      />
      <Stack.Screen
        name="FileGallery"
        component={FileGalleryScreen}
        options={{ headerShown: false, animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}