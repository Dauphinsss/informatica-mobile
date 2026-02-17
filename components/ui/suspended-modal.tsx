import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Surface,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface SuspendedModalProps {
  visible: boolean;
  onDismiss: () => void;
  reason?: string;
}

const DEFAULT_SUSPENSION_REASON = "Incumplimiento de normas de la comunidad.";

const SuspendedModal: React.FC<SuspendedModalProps> = ({ visible, reason }) => {
  const { theme, isDark } = useTheme();

  const handleLogout = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "usuarios", uid), {
          pushTokens: [],
          tokens: [],
        });
      }
      await GoogleSignin.signOut();
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      style={[styles.overlay, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.orbLarge,
          { backgroundColor: theme.colors.primaryContainer, opacity: isDark ? 0.22 : 0.18 },
        ]}
      />
      <View
        style={[
          styles.orbSmall,
          { backgroundColor: theme.colors.secondaryContainer, opacity: isDark ? 0.2 : 0.16 },
        ]}
      />

      <View style={styles.content}>
        <Surface
          elevation={2}
          style={[
            styles.iconWrap,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <IconButton
            icon="account-cancel"
            size={40}
            iconColor={theme.colors.onErrorContainer}
          />
        </Surface>

        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Cuenta suspendida
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Tu acceso fue restringido temporalmente por el equipo de administración.
        </Text>

        <Card style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="labelLarge" style={[styles.reasonLabel, { color: theme.colors.primary }]}>
              Motivo
            </Text>
            <Text variant="bodyMedium" style={[styles.reasonText, { color: theme.colors.onSurface }]}>
              {reason?.trim() ? reason.trim() : DEFAULT_SUSPENSION_REASON}
            </Text>

            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              Si consideras que fue un error, contacta a soporte para revisión.
            </Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          icon="logout"
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Cerrar sesión
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999999,
    elevation: 999999,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  orbLarge: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    top: -60,
    right: -70,
  },
  orbSmall: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 170,
    bottom: -40,
    left: -30,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 6,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 6,
  },
  card: {
    borderRadius: 14,
  },
  cardContent: {
    gap: 8,
  },
  reasonLabel: {
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  reasonText: {
    lineHeight: 22,
  },
  hint: {
    marginTop: 2,
    opacity: 0.85,
  },
  button: {
    borderRadius: 12,
    marginTop: 4,
  },
  buttonContent: {
    minHeight: 44,
  },
});

export default SuspendedModal;
