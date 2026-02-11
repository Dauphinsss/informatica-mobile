import { Alert, Platform, Share } from "react-native";

interface SharePublicationParams {
  publicacionId: string;
  titulo: string;
  descripcion: string;
  autorNombre: string;
  materiaNombre?: string;
}

/**
 * Obtiene el enlace profundo (deep link) para una publicación
 * Usa HTTPS (App Links) para que funcione al compartir (WhatsApp/Chrome).
 */
export const obtenerDeepLinkPublicacion = async (publicacionId: string): Promise<string> => {
  // App Links (Android): abre la app si está instalada y el dominio está verificado.
  // Fallback: si no está instalada, abre la web.
  return `https://informatica.art/publicacion/${publicacionId}`;
};

/**
 * Crea el mensaje amigable para compartir con estudiantes
 */
const crearMensajeCompartir = (
  params: SharePublicationParams,
  deepLink: string
): string => {
  const title = (params.titulo || "").trim();
  const author = (params.autorNombre || "").trim();
  const subject = (params.materiaNombre || "").trim();
  const descRaw = (params.descripcion || "").trim().replace(/\s+/g, " ");
  const desc =
    descRaw.length > 0
      ? descRaw.length > 140
        ? `${descRaw.slice(0, 140)}...`
        : descRaw
      : "";

  const lines = [
    `📚 *${title.length ? title : "Publicación"}*`,
    subject.length ? `🎓 _${subject}_` : undefined,
    author.length ? `👤 Por *${author}*` : undefined,
    desc.length ? `📝 ${desc}` : undefined,
    "",
    `🔗 Abrir publicación:`,
    deepLink,
  ].filter(Boolean) as string[];

  return lines.join("\n\n");
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
      title: params.titulo,
      url: Platform.OS === "ios" ? deepLink : undefined,
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
