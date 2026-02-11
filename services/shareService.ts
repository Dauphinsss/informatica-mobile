import { Alert, Platform, Share } from "react-native";

interface SharePublicationParams {
  publicacionId: string;
  titulo: string;
  descripcion: string;
  autorNombre: string;
  materiaNombre?: string;
}


export const obtenerDeepLinkPublicacion = async (publicacionId: string): Promise<string> => {
  
  
  return `https://informatica.art/publicacion/${publicacionId}`;
};

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

export const compartirPublicacionMejorado = async (
  params: SharePublicationParams
): Promise<void> => {
  try {
    const deepLink = await obtenerDeepLinkPublicacion(params.publicacionId);
    const mensaje = crearMensajeCompartir(params, deepLink);

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
