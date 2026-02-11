import SuspendedModal from '@/components/ui/suspended-modal';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useDeepLinking, useNotificationDeepLinking } from '@/hooks/useDeepLinking';
import { setNavigationRef } from '@/services/navigationService';
import {
  configurarCanalAndroid,
  regenerarTokens,
  solicitarPermisosNotificaciones,
} from '@/services/pushNotifications';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
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
