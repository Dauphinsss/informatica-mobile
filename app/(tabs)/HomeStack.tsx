import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import SubjectDetailScreen from "../subjects/SubjectDetailScreen";
import HomeScreen from "./index";
import CreatePublicationScreen from "../subjects/CreatePublicationScreen";
import PublicationDetailScreen from "../subjects/PublicationDetailScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
      />
      <Stack.Screen 
        name="SubjectDetail" 
        component={SubjectDetailScreen} 
      />
      <Stack.Screen 
        name="CreatePublication" 
        component={CreatePublicationScreen} 
      />
      <Stack.Screen 
        name="PublicationDetail" 
        component={PublicationDetailScreen} 
      />
    </Stack.Navigator>
  );
}
