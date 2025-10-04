import * as AuthSession from "expo-auth-session";
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
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth } from "../firebase";

export default function Login() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  // Para Expo, usa 'native' que genera un URI compatible con Web Client ID
  const redirectUri = AuthSession.makeRedirectUri({
    native: "informatica://redirect",
  });
  console.log("🔗 Redirect URI:", redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      // 🔑 Android Client ID - El único que acepta custom schemes
      clientId:
        "262339683739-djo0abe49vtq1ljk8eh4ac8n86r55l26.apps.googleusercontent.com",
      redirectUri: redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: AuthSession.ResponseType.IdToken,
    },
    discovery
  );

  // Escucha cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Maneja la respuesta de Google
  useEffect(() => {
    const run = async () => {
      if (response?.type === "success") {
        setLoading(true);
        try {
          // Con Android Client ID, obtenemos id_token directamente
          const { id_token } = response.params as { id_token: string };

          if (!id_token) {
            throw new Error("No se recibió id_token de Google");
          }

          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);
          Alert.alert(
            "✅ Bienvenido",
            `Hola, ${auth.currentUser?.displayName || "Usuario"}!`,
            [
              {
                text: "OK",
                onPress: () => router.push("/(tabs)"),
              },
            ]
          );
        } catch (err) {
          console.error("Error de autenticación:", err);
          Alert.alert("Error", "No se pudo autenticar en Firebase");
          setLoading(false);
        }
      } else if (response?.type === "error") {
        console.error("Error en OAuth:", response.error);
        Alert.alert(
          "Error",
          `Error de autenticación: ${response.error?.message || "Desconocido"}`
        );
      }
    };
    run();
  }, [response, router]);

  const handleLogout = async () => {
    try {
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

          <View style={styles.buttonContainer}>
            <Button
              title="Ir a Inicio"
              onPress={() => router.push("/(tabs)")}
              color="#4285F4"
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Cerrar Sesión"
              onPress={handleLogout}
              color="#DB4437"
            />
          </View>
        </View>
      ) : (
        // Usuario no autenticado
        <View style={styles.loginContainer}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Bienvenido a Informatica</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          <View style={styles.buttonContainer}>
            <Button
              title="🚀 Login con Google"
              disabled={!request}
              onPress={() => promptAsync()}
              color="#4285F4"
            />
          </View>
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
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  loginContainer: {
    alignItems: "center",
    gap: 20,
  },
  userContainer: {
    alignItems: "center",
    gap: 16,
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  userName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4285F4",
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
    width: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
