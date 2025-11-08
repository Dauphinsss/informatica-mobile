import { Alert, Platform, Share } from 'react-native';

interface SharePublicationParams {
  publicacionId: string;
  titulo: string;
  descripcion: string;
  autorNombre: string;
}

/**
 * Obtiene el enlace profundo (deep link) para una publicación
 * Usa TinyURL para acortar y que se vea azul en WhatsApp
 */
export const obtenerDeepLinkPublicacion = async (publicacionId: string): Promise<string> => {
  const deepLink = `informatica://publicacion/${publicacionId}`;
  
  try {
    // Usar TinyURL API (gratis, sin cuenta)
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(deepLink)}`);
    const shortUrl = await response.text();
    
    if (shortUrl && shortUrl.startsWith('http')) {
      return shortUrl; // Retorna link acortado (azul en WhatsApp)
    }
  } catch (error) {
    console.log('Error acortando link, usando deep link directo:', error);
  }
  
  // Fallback al deep link normal
  return deepLink;
};

/**
 * Crea el mensaje amigable para compartir con estudiantes
 */
const crearMensajeCompartir = (
  params: SharePublicationParams,
  deepLink: string
): string => {
  const truncatedDesc = params.descripcion.substring(0, 100).trim();
  const desc = truncatedDesc.length < params.descripcion.length 
    ? truncatedDesc + '...' 
    : truncatedDesc;

  if (Platform.OS === 'android') {
    return `━━━━━━━━━━━━━━━━━━━\n*${params.titulo}*\n━━━━━━━━━━━━━━━━━━━\n\n${desc}\n\n📚 Por: ${params.autorNombre}\n\n¡Abre este contenido en la app!\n${deepLink}`;
  } else {
    return `━━━━━━━━━━━━━━━━━━━\n${params.titulo}\n━━━━━━━━━━━━━━━━━━━\n\n${desc}\n\n📚 Por: ${params.autorNombre}\n\n¡Abre este contenido en la app!\n${deepLink}`;
  }
};

/**
 * Función principal para compartir publicaciones
 * Usa TinyURL para acortar el link y que sea clickeable en WhatsApp
 * Sin dependencias externas, sin servidores propios
 */
export const compartirPublicacionMejorado = async (
  params: SharePublicationParams
): Promise<void> => {
  try {
    const deepLink = await obtenerDeepLinkPublicacion(params.publicacionId);
    const mensaje = crearMensajeCompartir(params, deepLink);

    // Abrir el diálogo nativo de compartir
    const result = await Share.share({
      message: mensaje,
      title: `${params.titulo} - ${params.autorNombre}`,
      url: Platform.OS === 'ios' ? deepLink : undefined,
    });

    if (result.action === Share.dismissedAction) {
      console.log('Compartir cancelado');
    }
  } catch (error) {
    if ((error as any).code !== 'E_SHARE_CANCELLED') {
      console.error('Error al compartir:', error);
      Alert.alert('Error', 'No se pudo compartir la publicación');
    }
  }
};
