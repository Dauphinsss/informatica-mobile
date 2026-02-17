import SuspendedModal from '@/components/ui/suspended-modal';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useDeepLinking, useNotificationDeepLinking } from '@/hooks/useDeepLinking';
import { setNavigationRef } from '@/services/navigationService';
import {
  configurarCanalAndroid,
  regenerarTokens,
  solicitarPermisosNotificaciones,
} from '@/services/pushNotifications';
import { Pacifico_400Regular, useFonts } from "@expo-google-fonts/pacifico";
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LogBox,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabsLayout from './app/(tabs)/_layout';
import LoginScreen from './app/login';
import { auth, db } from './firebase';
import { useNotificationNavigation } from './scripts/hooks/useNotificationNavigation';


LogBox.ignoreLogs([
  
  'Invalid prop `index` supplied to `React.Fragment`',
  'Invalid prop `%s` supplied to `React.Fragment`',
  
  'BloomFilter error',
  '@firebase/firestore: Firestore',
]);

export const navigationRef = createNavigationContainerRef<any>();

function AppContent() {
  const { isDark, theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");

  const pendingActions = useMemo(() => [] as any[], []);

  
  useDeepLinking();
  useNotificationDeepLinking();

  const navWrapper = useMemo(() => ({
    navigate: (...args: any[]) => {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate(...args);
      } else {
        pendingActions.push({ type: 'navigate', args });
      }
    },
    reset: (state: any) => {
      if (navigationRef.isReady() && typeof navigationRef.reset === 'function') {
        
        navigationRef.reset(state);
      } else {
        pendingActions.push({ type: 'reset', state });
      }
    },
    getParent: () => undefined,
    _flush: () => {
      while (pendingActions.length > 0 && navigationRef.isReady()) {
        const action = pendingActions.shift();
        try {
          if (action.type === 'navigate') {
            (navigationRef as any).navigate(...action.args);
          } else if (action.type === 'reset') {
            navigationRef.reset(action.state);
          }
        } catch (err) {
          console.warn('Error ejecutando acción encolada', err, action);
        }
      }
    },
  }), [pendingActions]);

  useNotificationNavigation({ navigation: navWrapper });

  useEffect(() => {
    const inicializarNotificaciones = async () => {
      await configurarCanalAndroid();
      await solicitarPermisosNotificaciones();
      setNavigationRef(navigationRef);
    };
    inicializarNotificaciones();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'usuarios', user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData(data);
          setIsSuspended(data.estado === 'suspendido');
          setSuspensionReason(
            data.motivoSuspension ||
              data.razonSuspension ||
              data.motivoBan ||
              "",
          );
        }
      });
      return () => unsubscribe();
    } else {
      setIsSuspended(false);
      setUserData(null);
      setSuspensionReason("");
    }
  }, [user]);

  useEffect(() => {
    const registerTokens = async () => {
      if (user) {
        try {
          
          
          await regenerarTokens(user.uid);
        } catch (err) {
          console.warn('Error regenerando tokens:', err);
        }
      }
    };
    registerTokens();
  }, [user]);

  const handleNavigationReady = useCallback(() => {
    try {
      navWrapper._flush();
    } catch (err) {
      console.warn('Error al vaciar cola onReady', err);
    }
  }, [navWrapper]);

  if (loading) {
    return (
      <LaunchAnimation theme={theme} />
    );
  }

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        onReady={handleNavigationReady}
      >
        {user ? <TabsLayout /> : <LoginScreen />}
      </NavigationContainer>

      {isSuspended && (
        <SuspendedModal
          visible={true}
          reason={suspensionReason}
          onDismiss={() => {}}
        />
      )}

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

const LaunchAnimation = React.memo(({
  theme,
}: {
  theme: any;
}) => {
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });
  const slideCode = useRef(new Animated.Value(24)).current;
  const fadeCode = useRef(new Animated.Value(0)).current;
  const slideTitle = useRef(new Animated.Value(24)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const slideSubtitle = useRef(new Animated.Value(16)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.parallel([
        Animated.timing(fadeCode, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(slideCode, {
          toValue: 0,
          tension: 52,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeTitle, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(slideTitle, {
          toValue: 0,
          tension: 52,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeSubtitle, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(slideSubtitle, {
          toValue: 0,
          tension: 52,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [fadeCode, fadeSubtitle, fadeTitle, pulse, slideCode, slideSubtitle, slideTitle]);

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.launchContainer,
          { backgroundColor: theme.colors.background },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.launchContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Animated.View style={{ opacity: fadeCode, transform: [{ translateY: slideCode }] }}>
        <Text
          style={[
            styles.launchCode,
            { color: theme.colors.primary },
          ]}
        >
          {"</>"}
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: fadeTitle, transform: [{ translateY: slideTitle }] }}>
        <Text
          style={[
            styles.launchTitle,
            { color: theme.colors.onBackground },
          ]}
        >
          Informatica
        </Text>
        <Animated.View
          style={[
            styles.launchUnderline,
            {
              backgroundColor: theme.colors.primary,
              opacity: pulse,
            },
          ]}
        />
      </Animated.View>

      <Animated.View style={{ opacity: fadeSubtitle, transform: [{ translateY: slideSubtitle }] }}>
        <Text
          style={[
            styles.launchSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Cargando tu espacio academico
        </Text>
      </Animated.View>
    </View>
  );
});

LaunchAnimation.displayName = "LaunchAnimation";

const styles = StyleSheet.create({
  launchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  launchCode: {
    fontSize: 40,
    letterSpacing: 3,
    fontFamily: "Pacifico_400Regular",
    marginBottom: 14,
  },
  launchTitle: {
    fontSize: 48,
    textAlign: "center",
    fontFamily: "Pacifico_400Regular",
    letterSpacing: 0.6,
  },
  launchUnderline: {
    height: 3,
    width: 58,
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  launchSubtitle: {
    fontSize: 14,
    letterSpacing: 0.3,
    opacity: 0.85,
    textAlign: "center",
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PaperProviderWrapper />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const PaperProviderWrapper = React.memo(() => {
  const { theme } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <AppContent />
    </PaperProvider>
  );
});

PaperProviderWrapper.displayName = 'PaperProviderWrapper';
