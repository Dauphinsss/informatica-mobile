import * as Linking from 'expo-linking';
import { Alert, Platform, Share } from 'react-native';

interface SharePublicationParams {
  publicacionId: string;
  titulo: string;
  descripcion: string;
  autorNombre: string;
}

/**
 * Obtiene el enlace profundo (deep link) para una publicación
 * Formato: informatica://publicacion/{publicacionId}
 */
export const obtenerDeepLinkPublicacion = (publicacionId: string): string => {
  return `informatica://publicacion/${publicacionId}`;
};

/**
 * Obtiene el enlace web para una publicación
 * Se puede usar como fallback si no existe deep link
 */
export const obtenerEnlaceWebPublicacion = (publicacionId: string): string => {
  // Ajusta la URL según tu dominio
  return `https://informatica.app/publicacion/${publicacionId}`;
};

/**
 * Comprueba si la app está instalada usando el esquema personalizado
 */
export const verificarSiAppEstaInstalada = async (): Promise<boolean> => {
  try {
    // Intentar abrir con el esquema informatica
    const canOpen = await Linking.canOpenURL('informatica://');
    return canOpen;
  } catch (error) {
    console.error('Error al verificar si la app está instalada:', error);
    return false;
  }
};

/**
 * Abre la Play Store para descargar la app
 */
export const abrirPlayStore = async (): Promise<void> => {
  try {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.informatica.app';
    const appStoreUrl = 'https://apps.apple.com/app/informatica/id123456789'; // Ajusta el ID

    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('No se puede abrir la tienda de aplicaciones');
    }
  } catch (error) {
    console.error('Error al abrir la tienda:', error);
  }
};

/**
 * Crea un mensaje para compartir la publicación
 */
const crearMensajeCompartir = (
  params: SharePublicationParams,
  deepLink: string,
  enlaceWeb: string
): string => {
  const truncatedDesc = params.descripcion.substring(0, 100).trim();
  const desc = truncatedDesc.length < params.descripcion.length 
    ? truncatedDesc + '...' 
    : truncatedDesc;

  if (Platform.OS === 'android') {
    // Android soporta mejor el markdown de WhatsApp
    return `📚 *${params.titulo}*\n\n${desc}\n\nDe: ${params.autorNombre}\n\n📱 Abre en la app:\n${deepLink}\n\n🌐 O en el navegador:\n${enlaceWeb}`;
  } else {
    // iOS
    return `📚 ${params.titulo}\n\n${desc}\n\nDe: ${params.autorNombre}\n\n${enlaceWeb}`;
  }
};

/**
 * Función mejorada para compartir publicaciones
 * Usa React Native Share API para mostrar el diálogo nativo
 * Intenta abrir en la app si está instalada, sino muestra opciones
 */
export const compartirPublicacionMejorado = async (
  params: SharePublicationParams
): Promise<void> => {
  try {
    const deepLink = obtenerDeepLinkPublicacion(params.publicacionId);
    const enlaceWeb = obtenerEnlaceWebPublicacion(params.publicacionId);
    const mensaje = crearMensajeCompartir(params, deepLink, enlaceWeb);

    // Llamar al Share nativo
    const result = await Share.share({
      message: mensaje,
      title: `${params.titulo} - ${params.autorNombre}`,
      url: Platform.OS === 'ios' ? enlaceWeb : undefined, // iOS requiere URL
    });

    if (result.action === Share.dismissedAction) {
      // Usuario canceló
      console.log('Share cancelado');
    }
  } catch (error) {
    if ((error as any).code !== 'E_SHARE_CANCELLED') {
      console.error('Error al compartir:', error);
      Alert.alert('Error', 'No se pudo compartir la publicación');
    }
  }
};

/**
 * Abre el diálogo para compartir solo el enlace web
 */
export const compartirEnlaceWeb = async (params: SharePublicationParams): Promise<void> => {
  try {
    const enlaceWeb = obtenerEnlaceWebPublicacion(params.publicacionId);

    await Share.share({
      message: `Mira esta publicación: ${params.titulo}`,
      title: params.titulo,
      url: Platform.OS === 'ios' ? enlaceWeb : undefined,
    });
  } catch (error) {
    console.error('Error al compartir enlace web:', error);
  }
};
