import { useTheme } from "@/contexts/ThemeContext";
import { Pacifico_400Regular, useFonts } from "@expo-google-fonts/pacifico";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { auth, db } from "../firebase";
import { crearEstadisticasUsuario } from "../scripts/services/Users";

GoogleSignin.configure({
  webClientId:
    "262339683739-7gb126vkheeio7gshmhft4ehutm8lhgt.apps.googleusercontent.com",
});

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Partículas flotantes ───
const PARTICLE_COUNT = 12;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  size: number;
  startX: number;
  startY: number;
}

function useFloatingParticles(): Particle[] {
  const particles = useRef<Particle[]>([]);

  if (particles.current.length === 0) {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => {
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = Math.random() * SCREEN_HEIGHT;
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(startY),
        opacity: new Animated.Value(Math.random() * 0.3 + 0.05),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        size: Math.random() * 40 + 12,
        startX,
        startY,
      };
    });
  }

  useEffect(() => {
    const animations = particles.current.map((p) => {
      const duration = 5000 + Math.random() * 5000;
      // Offsets fijos para evitar teleportación
      const offsetY = 30 + Math.random() * 40;
      const offsetX = (Math.random() - 0.5) * 40;
      const opHigh = Math.random() * 0.2 + 0.1;
      const opLow = Math.random() * 0.08 + 0.02;

      const animateLoop = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(p.y, {
              toValue: p.startY - offsetY,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(p.y, {
              toValue: p.startY + offsetY * 0.3,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(p.x, {
              toValue: p.startX + offsetX,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: p.startX - offsetX,
              duration: duration * 1.1,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: opHigh,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: opLow,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animateLoop());
      };

      animateLoop();
      return () => {};
    });

    return () => animations.forEach((cleanup) => cleanup());
  }, []);

  return particles.current;
}

// ─── Typewriter </> ───
function useTypewriter(text: string, speed = 120, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  return { displayed, cursor: showCursor ? "|" : " " };
}

// ─── Feature chips data ───
const FEATURES = [
  { icon: "book-open-variant" as const, label: "Materiales" },
  { icon: "account-group" as const, label: "Comunidad" },
];

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const particles = useFloatingParticles();
  const { displayed, cursor } = useTypewriter("</>", 120, 800);
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  // Animaciones de entrada staggered
  const slideCode = useRef(new Animated.Value(30)).current;
  const fadeCode = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(30)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideSubtitle = useRef(new Animated.Value(20)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const slideChips = useRef(new Animated.Value(20)).current;
  const fadeChips = useRef(new Animated.Value(0)).current;
  const slideButton = useRef(new Animated.Value(30)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeCode, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideCode, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeTitle, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideTitle, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeSubtitle, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideSubtitle, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeChips, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideChips, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeButton, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideButton, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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

      const googleUser = userInfo.data?.user;
      const nombre =
        googleUser?.name ||
        googleUser?.givenName ||
        user.displayName ||
        "Sin nombre";
      const correo = googleUser?.email || user.email || "";
      const foto = googleUser?.photo || user.photoURL || "";

      const usuarioRef = doc(db, "usuarios", user.uid);
      const usuarioDoc = await getDoc(usuarioRef);

      if (!usuarioDoc.exists()) {
        await setDoc(usuarioRef, {
          uid: user.uid,
          correo: correo,
          nombre: nombre,
          foto: foto,
          rol: "usuario",
          estado: "activo",
          creadoEn: serverTimestamp(),
          ultimoAcceso: serverTimestamp(),
        });
        await crearEstadisticasUsuario(user.uid);
      } else {
        const datosActuales = usuarioDoc.data();
        await setDoc(
          usuarioRef,
          {
            uid: user.uid,
            correo: correo,
            nombre: nombre,
            foto: foto,
            rol: datosActuales?.rol || "usuario",
            estado: datosActuales?.estado || "activo",
            creadoEn: datosActuales?.creadoEn || serverTimestamp(),
            ultimoAcceso: serverTimestamp(),
          },
          { merge: true },
        );
      }
      setLoading(false);
    } catch (error: any) {
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
        <ActivityIndicator
          size="large"
          animating={true}
          color={theme.colors.primary}
        />
        <Text
          variant="bodyLarge"
          style={[styles.loadingText, { color: theme.colors.onBackground }]}
        >
          Iniciando sesion...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Partículas flotantes */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: isDark
                ? theme.colors.primaryContainer
                : theme.colors.primary,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}

      <View style={styles.content}>
        {/* Código animado </> — minimalista */}
        <Animated.View
          style={[
            styles.codeContainer,
            {
              opacity: fadeCode,
              transform: [{ translateY: slideCode }],
            },
          ]}
        >
          <Text style={[styles.codeText, { color: theme.colors.primary }]}>
            {displayed}
            <Text style={{ opacity: 0.4 }}>{cursor}</Text>
          </Text>
        </Animated.View>

        {/* Título */}
        <Animated.View
          style={{
            opacity: fadeTitle,
            transform: [{ translateY: slideTitle }],
          }}
        >
          <Text
            variant="displaySmall"
            style={[styles.title, { color: theme.colors.onBackground }]}
          >
            Informática
          </Text>
          <View style={styles.titleUnderline}>
            <View
              style={[
                styles.underlineLine,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        </Animated.View>

        {/* Subtítulo */}
        <Animated.View
          style={{
            opacity: fadeSubtitle,
            transform: [{ translateY: slideSubtitle }],
          }}
        >
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Tu espacio academico digital
          </Text>
        </Animated.View>

        {/* Feature chips */}
        <Animated.View
          style={[
            styles.chipsContainer,
            {
              opacity: fadeChips,
              transform: [{ translateY: slideChips }],
            },
          ]}
        >
          {FEATURES.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureChip,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={feature.icon}
                size={16}
                color={theme.colors.primary}
              />
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6 }}
              >
                {feature.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Botón de Google */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeButton,
              transform: [{ translateY: slideButton }],
            },
          ]}
        >
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: isDark ? theme.colors.surfaceVariant : "#fff",
                borderWidth: 1,
                borderColor: isDark ? theme.colors.outline + "60" : "#dadce0",
                opacity: pressed ? 0.85 : 1,
                ...(Platform.OS === "ios"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.1,
                      shadowRadius: 4,
                    }
                  : {
                      elevation: 2,
                    }),
              },
            ]}
          >
            <Svg width={20} height={20} viewBox="0 0 48 48">
              <Path
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                fill="#FFC107"
              />
              <Path
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                fill="#FF3D00"
              />
              <Path
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                fill="#4CAF50"
              />
              <Path
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                fill="#1976D2"
              />
            </Svg>
            <Text
              style={[
                styles.googleButtonText,
                { color: isDark ? theme.colors.onSurface : "#3c4043" },
              ]}
            >
              Continuar con Google
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          variant="labelSmall"
          style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}
        >
          v{Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  particle: {
    position: "absolute",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  codeContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  codeText: {
    fontSize: 42,
    fontFamily: "Pacifico_400Regular",
    letterSpacing: 4,
  },
  title: {
    textAlign: "center",
    fontFamily: "Pacifico_400Regular",
    letterSpacing: 1,
    paddingBottom: 6,
    includeFontPadding: true,
  },
  titleUnderline: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  underlineLine: {
    width: 50,
    height: 3,
    borderRadius: 2,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.8,
    letterSpacing: 0.3,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  footerText: {
    opacity: 0.4,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
