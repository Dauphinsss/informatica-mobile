import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import FileGalleryScreen from "../subjects/FileGalleryScreen";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";
import UltimasPublicacionesScreen from "./UltimasPublicacionesScreen";

const Stack = createNativeStackNavigator();

export default function MisPublicacionesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MisPublicacionesMain"
        component={UltimasPublicacionesScreen}
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
    </Stack.Navigator>
  );
}
