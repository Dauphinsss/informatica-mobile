import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../firebase";

// ⚙️ Configurar Google Sign-In
GoogleSignin.configure({
  webClientId:
    "262339683739-p5qq1du1e4uvaussr6tafu226jcfo0jh.apps.googleusercontent.com", // Web Client ID de Firebase
});

export default function Login() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Escucha cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔐 Función de inicio de sesión con Google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Verificar disponibilidad de Google Play Services
      await GoogleSignin.hasPlayServices();

      // Iniciar sesión con Google
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Usuario de Google:", userInfo);

      // Obtener el id_token
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error("No se recibió id_token de Google");
      }

      // Crear credencial de Firebase
      const credential = GoogleAuthProvider.credential(idToken);

      // Iniciar sesión en Firebase
      await signInWithCredential(auth, credential);

      Alert.alert(
        "✅ Bienvenido",
        `¡Hola, ${auth.currentUser?.displayName || "Usuario"}!`,
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)"),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Error de autenticación:", error);
      
      if (error.code === "SIGN_IN_CANCELLED") {
        Alert.alert("Cancelado", "Inicio de sesión cancelado");
      } else if (error.code === "IN_PROGRESS") {
        Alert.alert("En progreso", "Ya hay un inicio de sesión en progreso");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        Alert.alert(
          "Error",
          "Google Play Services no está disponible o está desactualizado"
        );
      } else {
        Alert.alert(
          "Error",
          `No se pudo iniciar sesión: ${error.message || "Error desconocido"}`
        );
      }
      
      setLoading(false);
    }
  };

  // 🚪 Función de cerrar sesión
  const handleLogout = async () => {
    try {
      // Cerrar sesión en Google
      await GoogleSignin.signOut();
      // Cerrar sesión en Firebase
      await signOut(auth);
      Alert.alert("👋 Sesión cerrada", "Has cerrado sesión correctamente");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Iniciando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? (
        // Usuario autenticado
        <View style={styles.userContainer}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.greeting}>¡Hola!</Text>
          <Text style={styles.userName}>{user.displayName || "Usuario"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : (
        // Usuario no autenticado
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Text style={styles.googleButtonText}>
              🔐 Iniciar sesión con Google
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  loginContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    color: "#4285F4",
    fontWeight: "600",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
