import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Linking } from 'react-native';

/**
 * Hook para manejar deep linking en la app
 * Detecta cuando se abre una URL con el esquema "informatica://"
 * y navega a la pantalla correspondiente
 */
export const useDeepLinking = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Manejar enlaces abiertos mientras la app está en foreground
    const handleDeepLink = ({ url }: { url: string }) => {
      let route: any = null;
      
      const path = url.substring(url.indexOf('://') + 3);
      const segments = path.split('/');

      console.log('Deep link recibido:', url);
      console.log('Segmentos:', segments);

      if (segments[0] === 'publicacion' && segments[1]) {
        const publicacionId = segments[1];
        console.log('Navegando a publicación:', publicacionId);

        // Navegar a la pantalla de detalle de publicación
        (navigation as any).navigate('PublicationDetail', {
          publicacionId,
          materiaNombre: 'Publicación compartida',
        });
      }
    };

    // Listener para cuando el app está abierto y recibe un deep link
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Verificar si la app fue abierta desde un deep link
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [navigation]);
};

/**
 * Hook para manejar notificaciones que contienen deep links
 * Se ejecuta cuando el usuario toca una notificación
 */
export const useNotificationDeepLinking = () => {
  const navigation = useNavigation();

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
            (navigation as any).navigate('PublicationDetail', {
              publicacionId,
              materiaNombre: 'Publicación compartida',
            });
          }
        }
      });

    return () => {
      notificationResponseSubscription.remove();
    };
  }, [navigation]);
};
