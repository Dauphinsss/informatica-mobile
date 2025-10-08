import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AdminScreen from "../(tabs)/admin";
import ManageUsers from "./manage-users";

const Stack = createStackNavigator();

export default function AdminLayOut() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Ocultamos el header del stack porque cada pantalla maneja el suyo
      }}
    >
      <Stack.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{
          title: "Panel Admin"
        }}
      />
      <Stack.Screen 
        name="ManageUsers" 
        component={ManageUsers}
        options={{
          title: "Administrar Usuarios"
        }}
      />
    </Stack.Navigator>
  );
}
