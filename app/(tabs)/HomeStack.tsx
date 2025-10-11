import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import SubjectDetailScreen from "../subjects/subject-detail";
import HomeScreen from "./index";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
    </Stack.Navigator>
  );
}
