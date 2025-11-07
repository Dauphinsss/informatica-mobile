import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

interface NotificationData {
  notificacionId?: string;
  tipo?: string;
  accion?: string;
  materiaId?: string;
  materiaNombre?: string;
  publicacionId?: string;
  deepLink?: string;
  clickAction?: string;
}

type ReactNavigation = {
  navigate: (name: string, params?: any) => void;
  getParent?: () => any;
};

interface UseNotificationNavigationProps {
  navigation?: ReactNavigation;
}

export function useNotificationNavigation({ navigation }: UseNotificationNavigationProps = {}) {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const processedIds = useRef<Set<string>>(new Set());

  const goTo = (path: string, notificationData?: NotificationData) => {
    if (!navigation) {
      console.warn('No hay navigation disponible');
      return;
    }

    const segments = path.split('/').filter(Boolean);
    
    const tabNavigation = navigation.getParent?.() || navigation;
    
    try {
      if (segments[0] === 'materias' && segments[2] === 'publicaciones') {
        const materiaId = segments[1];
        const publicacionId = segments[3];

        const materiaNombre = notificationData?.materiaNombre || 'Materia';

        const resetState = {
          index: 0,
          routes: [
            {
              name: 'Home',
              state: {
                index: 2,
                routes: [
                  { name: 'HomeMain' },
                  { name: 'SubjectDetail', params: { nombre: materiaNombre, id: materiaId, materiaId } },
                  { name: 'PublicationDetail', params: { publicacionId, materiaNombre } },
                ],
              },
            },
          ],
        };

        try {
           if (navigation && typeof (navigation as any).reset === 'function') {
            try {
              // @ts-ignore
              (navigation as any).reset(resetState);
             return;
            } catch (err) {
              console.warn('Reset via navigation falló, fallback:', err);
            }
          }
        } catch (err) {
          console.warn('Error comprobando reset en navigation:', err);
        }

        try {
          tabNavigation.navigate('Home', {
            screen: 'SubjectDetail',
            params: { nombre: materiaNombre, id: materiaId, materiaId },
            initial: false,
          });

          setTimeout(() => {
            try {
              tabNavigation.navigate('Home', {
                screen: 'PublicationDetail',
                params: { publicacionId, materiaNombre },
                initial: false,
              });
            } catch (err) {
              console.warn('❌ [Nav] Error navegando a PublicationDetail en fallback:', err);
            }
          }, 350);
        } catch (err) {
          console.error('❌ [Nav] Fallback de navegación falló:', err);
        }

        return;
      }
      
      if (segments[0] === 'materias' && segments.length === 2) {
        const materiaId = segments[1];
        
        tabNavigation.navigate('Home', {
          screen: 'SubjectDetail',
          params: {
            id: materiaId,
            materiaId: materiaId,
          },
          initial: false,
        });
        return;
      }

      if (segments[0] === 'perfil' && segments[1] === 'notificaciones') {
        tabNavigation.navigate('Profile', {
          screen: 'ProfileMain'
        });
        
        return;
      }
      
      if (segments[0] === 'notificaciones') {
        tabNavigation.navigate('Notifications');
        return;
      }
      
      tabNavigation.navigate('Notifications');
      
    } catch (error) {
      console.error('Error en navegación:', error);
      
      if (path.startsWith('/')) {
        const deepLinkUrl = `informatica:/${path}`;
        
        Linking.openURL(deepLinkUrl).catch(err => 
          console.error('Error abriendo deep link:', err)
        );
      }
    }
  };

  useEffect(() => {

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as NotificationData;
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const raw = response?.notification?.request?.content?.data as NotificationData | undefined;
        const id = response?.notification?.request?.identifier || raw?.notificacionId || JSON.stringify(raw);
        if (id && processedIds.current.has(id)) {
          return;
        }

        const data = raw as NotificationData;

        if (id) processedIds.current.add(id);

        setTimeout(() => {
          handleNotificationNavigation(data);
        }, 300);
      }
    );

    const handleDeepLink = (event: { url: string }) => {
      setTimeout(() => handleDeepLinkNavigation(event.url), 300);
    };
    
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        setTimeout(() => handleDeepLinkNavigation(url), 800);
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification?.request?.content?.data as NotificationData | undefined;
        const hasMeaningful = !!(data && (data.deepLink || data.accion || data.publicacionId || data.materiaId || data.notificacionId));
        if (hasMeaningful) {
          const id = response.notification.request.identifier || data?.notificacionId || JSON.stringify(data);
          if (id && processedIds.current.has(id)) {
            console.log('Notificación de arranque ya procesada, ignorando:', id);
          } else {
            if (id) processedIds.current.add(id);
            setTimeout(() => handleNotificationNavigation(data!), 800);
          }
        }
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      linkingSubscription.remove();
    };
  }, [navigation]);

  const handleNotificationNavigation = (data: NotificationData) => {
    if (data?.publicacionId && data?.materiaId) {
      goTo(`/materias/${data.materiaId}/publicaciones/${data.publicacionId}`, data);
      return;
    }

    if (data.deepLink) {
      handleDeepLinkNavigation(data.deepLink, data);
      return;
    }

    switch (data.accion) {
      case 'ver_publicacion':
        if (data.materiaId && data.publicacionId) {
          goTo(`/materias/${data.materiaId}/publicaciones/${data.publicacionId}`, data);
        } else {
          console.warn('Faltan datos para ver_publicacion:', data);
          goTo('/notificaciones');
        }
        break;
        
      case 'ver_materia':
      case 'notificacion_materia':
        console.log('Ignorando ver_materia, manejado por configurarListenerNotificaciones');
        break;
        
      case 'admin_decision':
        console.log('Acción: admin_decision');
        goTo('/perfil/notificaciones', data);
        break;
        
      default:
        console.log('Acción no reconocida, yendo a notificaciones:', data.accion);
        goTo('/notificaciones');
    }
  };

  const handleDeepLinkNavigation = (url: string, notificationData?: NotificationData) => {    
    let path = url;

    if (url.startsWith('informatica://')) {
      path = url.replace('informatica://', '/');
    } else if (url.startsWith('https://')) {
      const parsed = Linking.parse(url);
      path = parsed.path ? `/${parsed.path}` : '/';
    }

    goTo(path, notificationData);
  };

  return {
    handleNotificationNavigation,
    handleDeepLinkNavigation,
  };
}