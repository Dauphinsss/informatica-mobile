import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import MisPublicacionesScreen from "../profile/MisPublicacionesScreen";
import ProfileScreen from "./profile";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MisPublicacionesScreen" component={MisPublicacionesScreen} />
    </Stack.Navigator>
  );
}