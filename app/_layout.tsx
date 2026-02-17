import SuspendedModal from "@/components/ui/suspended-modal";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import {
  configurarCanalAndroid,
  solicitarPermisosNotificaciones,
} from "@/services/pushNotifications";
import { StatusBar } from "expo-status-bar";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, db } from "../firebase";
import TabsLayout from "./(tabs)/_layout";
import LoginScreen from "./login";

function AppContent() {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  useEffect(() => {
    const inicializarNotificaciones = async () => {
      await configurarCanalAndroid();
      await solicitarPermisosNotificaciones();
    };
    inicializarNotificaciones();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      console.log("🔐 Auth:", currentUser ? "✅ Logged in" : "❌ Logged out");
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUserData]);

  
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "usuarios", user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setUserData(userData);
          setIsSuspended(userData.estado === "suspendido");
          setSuspensionReason(
            userData.motivoSuspension ||
              userData.razonSuspension ||
              userData.motivoBan ||
              ""
          );
        }
      });
      return () => unsubscribe();
    } else {
      setIsSuspended(false);
      setSuspensionReason("");
      setUserData(null);
    }
  }, [user, setUserData]);

  useEffect(() => {
    const registerTokens = async () => {
      if (user) {
        try {
          const { regenerarTokens } = await import("@/services/pushNotifications");
          
          await regenerarTokens(user.uid);
          console.log("Tokens regenerados exitosamente");
        } catch (err) {
          console.warn("Error regenerando tokens:", err);
        }
      }
    };
    registerTokens();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  
  return (
    <>
      {user ? <TabsLayout /> : <LoginScreen />}
      {}
      <SuspendedModal
        visible={isSuspended}
        reason={suspensionReason}
        onDismiss={() => {}}
      />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <AppContent />
    </PaperProvider>
  );
}
