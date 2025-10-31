import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import {
    configurarCanalAndroid,
    registrarTokens,
    solicitarPermisosNotificaciones,
} from '@/services/pushNotifications';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import TabsLayout from './app/(tabs)/_layout';
import LoginScreen from './app/login';
import { auth, db } from './firebase';
import { useNotificationNavigation } from './scripts/hooks/useNotificationNavigation';
import SuspendedModal from '@/components/ui/suspended-modal';

export const navigationRef = createNavigationContainerRef();

function AppContent() {
  const { isDark, theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  const pendingActions = useMemo(() => [] as any[], []);

  const navWrapper = useMemo(() => ({
    navigate: (...args: any[]) => {
      if (navigationRef.isReady()) {
        // @ts-ignore
        navigationRef.navigate(...args);
      } else {
        pendingActions.push({ type: 'navigate', args });
      }
    },
    reset: (state: any) => {
      if (navigationRef.isReady() && typeof navigationRef.reset === 'function') {
        // @ts-ignore
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
            // @ts-ignore
            navigationRef.navigate(...action.args);
          } else if (action.type === 'reset') {
            // @ts-ignore
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
        }
      });
      return () => unsubscribe();
    } else {
      setIsSuspended(false);
      setUserData(null);
    }
  }, [user]);

  useEffect(() => {
    const registerTokens = async () => {
      if (user) {
        try {
          const expoToken = (
            await Notifications.getExpoPushTokenAsync({
              projectId: '7c7b0c2f-b147-414d-90e9-e80c65c42571',
            })
          ).data;
          const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
          await registrarTokens(user.uid, expoToken, fcmToken);
        } catch (err) {
          console.warn('Error registrando tokens:', err);
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
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
          onDismiss={() => {}}
        />
      )}

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProviderWrapper />
      </ThemeProvider>
    </SafeAreaProvider>
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