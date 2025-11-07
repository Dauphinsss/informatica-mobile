import { useTheme } from "@/contexts/ThemeContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { auth, db } from "../firebase";
import { crearEstadisticasUsuario } from "../scripts/services/Users";
import { useSafeAreaInsets } from "react-native-safe-area-context";

GoogleSignin.configure({
  webClientId:
    "262339683739-7gb126vkheeio7gshmhft4ehutm8lhgt.apps.googleusercontent.com",
});

export default function LoginScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

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
      const result = await signInWithCredential(auth, credential);

      const user = result.user;
      const usuarioRef = doc(db, "usuarios", user.uid);
      const usuarioDoc = await getDoc(usuarioRef);

      console.log("Datos del usuario de Google:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      if (!usuarioDoc.exists()) {
        console.log("Creando nuevo usuario en Firestore");
        await setDoc(usuarioRef, {
          uid: user.uid,
          correo: user.email || "",
          nombre: user.displayName || "Usuario sin nombre",
          foto: user.photoURL || "",
          rol: "usuario",
          estado: "activo",
          creadoEn: serverTimestamp(),
          ultimoAcceso: serverTimestamp(),
        });
        await crearEstadisticasUsuario(user.uid);
      } else {
        console.log("Usuario ya existe, actualizando datos");
        const datosActuales = usuarioDoc.data();
        await setDoc(
          usuarioRef,
          {
            correo: user.email || datosActuales?.correo || "",
            nombre: user.displayName || datosActuales?.nombre || "Usuario sin nombre",
            foto: user.photoURL || datosActuales?.foto || "",
            rol: datosActuales?.rol || "usuario",
            estado: datosActuales?.estado || "activo",
            ultimoAcceso: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error: any) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" animating={true} />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Iniciando sesión...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}
    >
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
