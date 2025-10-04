import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { auth } from "../firebase";

// ⚙️ Configurar Google Sign-In
GoogleSignin.configure({
  webClientId:
    "262339683739-7gb126vkheeio7gshmhft4ehutm8lhgt.apps.googleusercontent.com",
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  // 🔐 Iniciar sesión con Google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error("No se recibió id_token");
      }

      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // El layout principal manejará la redirección automáticamente
    } catch (error: any) {
      console.error("❌ Error:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" animating={true} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Iniciando sesión...
        </Text>
      </View>
    );
  }

  // Pantalla de login
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Informatica
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Inicia sesión para continuar
        </Text>
        <Button
          mode="contained-tonal"
          onPress={handleGoogleSignIn}
          icon="google"
          style={styles.button}
          disabled={loading}
        >
          Continuar con Google
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
  },
  content: {
    width: "100%",
    paddingHorizontal: 40,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.7,
  },
  button: {
    width: "100%",
  },
  
});
