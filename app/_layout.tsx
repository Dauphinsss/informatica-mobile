import SuspendedModal from "@/components/ui/suspended-modal";
import { StatusBar } from "expo-status-bar";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { auth, db } from "../firebase";
import TabsLayout from "./(tabs)/_layout";
import LoginScreen from "./login";

// Usar tema por defecto de Material Design 3
const theme = MD3LightTheme;

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("🔐 Auth:", currentUser ? "✅ Logged in" : "❌ Logged out");
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUserData]);

  // Escuchar cambios en el estado del usuario
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "usuarios", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setUserData(userData);
          setIsSuspended(userData.estado === "suspendido");
        }
      });
      return () => unsubscribe();
    } else {
      setIsSuspended(false);
      setUserData(null);
    }
  }, [user, setUserData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Estructura principal con el modal de suspensión al nivel más alto
  return (
    <>
      {user ? <TabsLayout /> : <LoginScreen />}
      {/* Modal de suspensión al nivel más alto - cubre TODO */}
      <SuspendedModal visible={isSuspended} onDismiss={() => {}} />
    </>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <AppContent />
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
