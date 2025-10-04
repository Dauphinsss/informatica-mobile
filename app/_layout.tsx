import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { auth } from "../firebase";
import TabsLayout from "./(tabs)/_layout";
import LoginScreen from "./login";

// Tema personalizado en modo claro
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4285F4",
    secondary: "#34A853",
  },
};

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("🔐 Auth:", currentUser ? "✅ Logged in" : "❌ Logged out");
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Si hay usuario, mostrar tabs. Si no, mostrar login.
  return user ? <TabsLayout /> : <LoginScreen />;
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AppContent />
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
