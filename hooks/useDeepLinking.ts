import { navigationRef } from '@/App';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Linking } from 'react-native';

/**
 * Hook para manejar deep linking en la app
 * Detecta cuando se abre una URL con el esquema "informatica://"
 * y navega a la pantalla correspondiente
 */
export const useDeepLinking = () => {
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const path = url.substring(url.indexOf('://') + 3);
      const segments = path.split('/');

      console.log('Deep link recibido:', url);
      console.log('Segmentos:', segments);

      if (segments[0] === 'publicacion' && segments[1]) {
        const publicacionId = segments[1];
        console.log('Navegando a publicacion:', publicacionId);

        if (navigationRef.isReady()) {
          try {
            (navigationRef as any).navigate('Home', {
              screen: 'PublicationDetail',
              params: {
                publicacionId,
                materiaNombre: 'Publicación compartida',
              },
            });
            console.log('Navegacion completada');
          } catch (error) {
            console.error('Error navegando:', error);
          }
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url != null) {
        console.log('App abierta desde deep link:', url);
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);
};

/**
 * Hook para manejar notificaciones que contienen deep links
 * Se ejecuta cuando el usuario toca una notificación
 */
export const useNotificationDeepLinking = () => {
  useEffect(() => {
    // Listener para respuestas de notificaciones
    const notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;

        if (data?.deepLink && typeof data.deepLink === 'string') {
          console.log('Deep link desde notificación:', data.deepLink);
          const path = data.deepLink.substring(data.deepLink.indexOf('://') + 3);
          const segments = path.split('/');

          if (segments[0] === 'publicacion' && segments[1]) {
            const publicacionId = segments[1];
            if (navigationRef.isReady()) {
              // Primero navega al tab de Home, luego a PublicationDetail
              (navigationRef as any).navigate('Home', {
                screen: 'PublicationDetail',
                params: {
                  publicacionId,
                  materiaNombre: 'Publicación compartida',
                },
              });
            }
          }
        }
      });

    return () => {
      notificationResponseSubscription.remove();
    };
  }, []);
};
