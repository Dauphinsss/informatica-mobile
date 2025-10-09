import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import HomeScreen from "../(tabs)/index";
import MySubjects from "./my-subjects";

const Stack = createStackNavigator();

export default function SubjectsLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Cada pantalla maneja su propio header
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: "Inicio"
        }}
      />
      <Stack.Screen 
        name="MySubjects" 
        component={MySubjects}
        options={{
          title: "Mis Materias"
        }}
      />
    </Stack.Navigator>
  );
}