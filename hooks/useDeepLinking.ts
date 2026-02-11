import { navigationRef } from '@/App';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

export const useDeepLinking = () => {
  const processedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    const esDeepLinkPublicacion = (url: string): boolean => {
      if (!url) return false;
      
      // Acepta tanto el scheme nativo como el App Link https del dominio.
      const schemeRegex = /^informatica:\/\/publicacion\/[a-zA-Z0-9_-]+$/;
      const httpsRegex = /^https:\/\/informatica\.art\/publicacion\/[a-zA-Z0-9_-]+$/;
      return schemeRegex.test(url) || httpsRegex.test(url);
    };

    const navegarAPublicacion = (publicacionId: string) => {
      if (!navigationRef.isReady()) {
        // Si no está listo, esperar un momento y reintentar
        setTimeout(() => navegarAPublicacion(publicacionId), 300);
        return;
      }

      try {
        console.log('Deep Link: Navegando a publicación compartida:', publicacionId);
        
        (navigationRef as any).navigate('Home', {
          screen: 'PublicationDetail',
          params: {
            publicacionId,
            materiaNombre: 'Publicación compartida',
          },
        });
      } catch (error) {
        console.error('Deep Link: Error navegando a publicación:', error);
      }
    };

    /**
     * Procesa el deep link solo si es válido y no ha sido procesado antes
     */
    const procesarDeepLink = (url: string) => {
      // Verificar que sea un deep link de publicación compartida
      if (!esDeepLinkPublicacion(url)) {
        console.log('Deep Link: URL ignorada (no es publicación compartida):', url);
        return;
      }

      processedUrls.current.add(url);

      // Extraer el ID de la publicación
      const segments = url.split('/');
      const publicacionId = segments[segments.length - 1];

      if (!publicacionId) {
        console.warn('Deep Link: ID de publicación no encontrado en:', url);
        return;
      }

      console.log('Deep Link: Procesando publicación compartida:', publicacionId);
      navegarAPublicacion(publicacionId);
    };

    // Listener para cuando la app ya está abierta y se hace clic en un link
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      procesarDeepLink(event.url);
    });

    // Verificar si la app se abrió desde un deep link (app cerrada)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Deep Link: App iniciada desde URL:', url);
        procesarDeepLink(url);
      }
    }).catch((error) => {
      console.error('Deep Link: Error obteniendo URL inicial:', error);
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);
};


export const useNotificationDeepLinking = () => {
  // Hook vacío - las notificaciones se manejan en useNotificationNavigation
};
