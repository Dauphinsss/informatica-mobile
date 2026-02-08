import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
  Divider,
  Surface,
  Text,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UserProfileModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function UserProfileModal({
  visible,
  onDismiss,
}: UserProfileModalProps) {
  const { theme } = useTheme();
  const user = auth.currentUser;
  const navigation = useNavigation<any>();
  const [isMounted, setIsMounted] = useState(visible);
  const [userRole, setUserRole] = useState<string>("usuario");

  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "usuarios", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserRole(docSnap.data()?.rol || "usuario");
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (visible) {
      // Montar el modal
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animación de salida antes de desmontar
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setIsMounted(false)); // desmontar al finalizar
    }
  }, [visible]);

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
      onDismiss();
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };

  if (!isMounted || !user) return null;

  return (
    <Modal
      visible={isMounted}
      transparent
      statusBarTranslucent
      animationType="none"
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Fondo (overlay) */}
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPress} onPress={onDismiss} />
        </Animated.View>

        {/* Contenedor deslizante */}
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Surface
              style={[styles.modal, { backgroundColor: theme.colors.surface }]}
              elevation={5}
            >
              <View style={styles.currentAccount}>
                <View style={{ position: "relative" }}>
                  {user.photoURL ? (
                    <Avatar.Image size={72} source={{ uri: user.photoURL }} />
                  ) : (
                    <Avatar.Text
                      size={72}
                      label={user.displayName?.charAt(0).toUpperCase() || "?"}
                    />
                  )}
                  <AdminBadge size={72} isAdmin={userRole === "admin"} />
                </View>
                <Text
                  variant="titleLarge"
                  style={[styles.userName, { color: theme.colors.onSurface }]}
                >
                  {user.displayName || "Usuario"}
                </Text>
                {userRole === "admin" && (
                  <Chip
                    icon="shield-check"
                    compact
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    textStyle={{ fontSize: 11, color: theme.colors.primary }}
                  >
                    Administrador
                  </Chip>
                )}
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.userEmail,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {user.email}
                </Text>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              <Pressable
                onPress={() => {
                  onDismiss();
                  navigation.navigate("MisPublicacionesScreen");
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    backgroundColor: pressed
                      ? theme.colors.surfaceVariant
                      : "transparent",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="folder-account-outline"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurface, marginLeft: 12 }}
                >
                  Mis Materiales
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                  style={{ marginLeft: "auto" }}
                />
              </Pressable>

              <View style={{ height: 12 }} />

              <Button
                mode="contained"
                onPress={handleLogout}
                icon="logout"
                style={styles.logoutButton}
                contentStyle={styles.logoutButtonContent}
                compact
              >
                Cerrar sesión
              </Button>

              <Button
                mode="text"
                onPress={onDismiss}
                style={styles.cancelButton}
                contentStyle={styles.cancelButtonContent}
                compact
              >
                Cancelar
              </Button>
            </Surface>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayPress: {
    flex: 1,
  },
  modalContainer: {
    width: "100%",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    minHeight: 280,
  },
  currentAccount: {
    alignItems: "center",
    paddingBottom: 24,
    gap: 8,
  },
  userName: {
    fontWeight: "600",
    marginTop: 12,
  },
  userEmail: {
    fontSize: 13,
  },
  logoutButton: {
    marginBottom: 8,
    borderRadius: 8,
  },
  logoutButtonContent: {
    paddingVertical: 2,
  },
  cancelButton: {
    borderRadius: 8,
  },
  cancelButtonContent: {
    paddingVertical: 0,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
