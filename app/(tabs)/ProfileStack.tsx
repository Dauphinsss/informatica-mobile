import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import MisPublicacionesScreen from "../profile/MisPublicacionesScreen";
import FileGalleryScreen from "../subjects/FileGalleryScreen";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";
import NotificationsSettingsScreen from "./NotificationsSettingsScreen";
import HelpCenterScreen from "./HelpCenterScreen";
import ProfileScreen from "./profile";

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
      <Stack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
      />
    </Stack.Navigator>
  );
}