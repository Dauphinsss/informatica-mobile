import SuspendedModal from "@/components/ui/suspended-modal";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import {
  configurarCanalAndroid,
  solicitarPermisosNotificaciones,
} from "@/services/pushNotifications";
import { StatusBar } from "expo-status-bar";
import { doc, onSnapshot } from "firebase/firestore";
import { use, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, db } from "../firebase";
import TabsLayout from "./(tabs)/_layout";
import LoginScreen from "./login";
import { registrarTokens } from "@/services/pushNotifications";
import * as Notificacions from 'expo-notifications'

function AppContent() {
  const { isDark } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

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

  useEffect(() => {
    const registerTokens = async () => {
      if (user) {
        const expoToken = (await Notificacions.getExpoPushTokenAsync({ projectId: '7c7b0c2f-b147-414d-90e9-e80c65c42571' })).data;
        const { data: fcmToken } = await Notificacions.getDevicePushTokenAsync();
        console.log("Registrando tokens:", { expoToken, fcmToken });
        registrarTokens(user.uid, expoToken, fcmToken);
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

  // Estructura principal con el modal de suspensión al nivel más alto
  return (
    <>
      {user ? <TabsLayout /> : <LoginScreen />}
      {/* Modal de suspensión al nivel más alto - cubre TODO */}
      <SuspendedModal visible={isSuspended} onDismiss={() => {}} />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
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
