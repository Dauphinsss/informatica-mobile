import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";
import React from "react";
import { Dimensions, StatusBar, StyleSheet, View } from "react-native";
import { Button, Card, Divider, IconButton, Text } from "react-native-paper";
import { doc, updateDoc } from "firebase/firestore";

interface SuspendedModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const SuspendedModal: React.FC<SuspendedModalProps> = ({ visible, onDismiss }) => {
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
    <View style={[styles.overlayContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        backgroundColor={theme.colors.background}
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      <View style={styles.content}>
        {}
        <View style={styles.iconContainer}>
          <IconButton 
            icon="alert-circle" 
            size={80} 
            iconColor={theme.colors.error}
            style={[styles.iconBackground, { backgroundColor: theme.colors.errorContainer }]}
          />
        </View>

        {}
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onBackground }]}>
          Cuenta Suspendida
        </Text>

        {}
        <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              Acceso Restringido
            </Text>
            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="bodyLarge" style={[styles.description, { color: theme.colors.onSurface }]}>
              Tu cuenta ha sido suspendida temporalmente. No puedes acceder a la aplicación en este momento.
            </Text>
            
            <Text variant="bodyMedium" style={[styles.contactInfo, { color: theme.colors.onSurfaceVariant }]}>
              Para obtener más información sobre tu suspensión, contacta con el equipo de soporte.
            </Text>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <View style={styles.importantSection}>
              <IconButton 
                icon="information" 
                size={20} 
                iconColor={theme.colors.primary}
                style={[styles.infoIcon, { backgroundColor: theme.colors.primaryContainer }]}
              />
              <Text variant="titleSmall" style={[styles.importantNote, { color: theme.colors.onSurface }]}>
                Información importante:
              </Text>
            </View>
            <Text variant="bodyMedium" style={[styles.noteText, { color: theme.colors.onSurfaceVariant }]}>
              En caso de que tu cuenta haya sido reactivada, será necesario que vuelvas a iniciar sesión para acceder a la aplicación.
            </Text>
          </Card.Content>
        </Card>

        {}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          labelStyle={styles.logoutButtonText}
          icon="logout"
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.onErrorContainer}
        >
          Cerrar Sesión
        </Button>

        {}
        <Text variant="bodySmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
          Esta acción cerrará tu sesión actual
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    bottom: -100,
    width: screenWidth,
    height: screenHeight + 200,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  iconBackground: {
    borderRadius: 50,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  infoCard: {
    width: '100%',
    marginBottom: 30,
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  contactInfo: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
  },
  importantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    margin: 0,
    borderRadius: 15,
  },
  importantNote: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noteText: {
    opacity: 0.9,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logoutButton: {
    width: '100%',
    marginBottom: 12,
  },
  logoutButtonContent: {
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default SuspendedModal;