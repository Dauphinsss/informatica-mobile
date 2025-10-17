import { Platform } from 'react-native';

// Importaciones condicionales para evitar errores en Expo Go
let Device: any;
let Notifications: any;

try {
  Device = require('expo-device');
  Notifications = require('expo-notifications');
  
  // Configuración de cómo se muestran las notificaciones
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Módulos de notificaciones no disponibles (Expo Go)');
}

/**
 * Solicitar permisos de notificaciones
 */
export async function solicitarPermisosNotificaciones() {
  if (!Device || !Notifications) {
    console.log('Notificaciones push no disponibles en Expo Go');
    return false;
  }

  if (!Device.isDevice) {
    console.log('Las notificaciones solo funcionan en dispositivos físicos');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('No se otorgaron permisos de notificaciones');
    return false;
  }
  return true;
}

/**
 * Configurar canal de notificaciones para Android
 */
export async function configurarCanalAndroid() {
  if (!Notifications || Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones de Materias',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('materias', {
      name: 'Materias y Publicaciones',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      description: 'Notificaciones sobre materias y publicaciones nuevas',
    });
  } catch (error) {
    console.log('Error al configurar canales de Android:', error);
  }
}

/**
 * Enviar notificación local (sin servidor)
 */
export async function enviarNotificacionLocal(
  titulo: string,
  descripcion: string,
  data?: any
) {
  if (!Notifications) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: descripcion,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: data || {},
        badge: 1,
      },
      trigger: null, // null = inmediato
    });
  } catch (error) {
  }
}

/**
 * Notificación cuando se crea una materia
 */
export async function notificarNuevaMateria(
  materiaNombre: string,
  materiaId: string
) {
  await enviarNotificacionLocal(
    'Nueva materia disponible',
    `Se ha creado la materia: ${materiaNombre}`,
    {
      tipo: 'materia',
      materiaId: materiaId,
      accion: 'ver_materia',
    }
  );
}

/**
 * Notificación cuando se crea una publicación en una materia
 */
export async function notificarNuevaPublicacion(
  materiaNombre: string,
  materiaId: string,
  publicacionTitulo: string,
  publicacionId: string
) {
  await enviarNotificacionLocal(
    `📢 Nueva publicación en ${materiaNombre}`,
    publicacionTitulo,
    {
      tipo: 'publicacion',
      materiaId: materiaId,
      publicacionId: publicacionId,
      accion: 'ver_publicacion',
    }
  );
}

/**
 * Configurar listener cuando el usuario toca una notificación
 * Navega a la pantalla correspondiente
 */
export function configurarListenerNotificaciones(
  navigation: any,
  callback?: (data: any) => void
) {
  if (!Notifications) {
    return { remove: () => {} };
  }

  // Cuando la app está abierta y tocas la notificación
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: any) => {
      const data = response.notification.request.content.data;

      if (callback) {
        callback(data);
      }

      // Navegar según el tipo
      if (data.tipo === 'materia' && data.materiaId) {
        // Navegar a la materia
        navigation.navigate('subjects', {
          screen: 'subject-detail',
          params: { id: data.materiaId },
        });
      } else if (data.tipo === 'publicacion' && data.materiaId) {
        // Navegar a la publicación dentro de la materia
        navigation.navigate('subjects', {
          screen: 'subject-detail',
          params: { 
            id: data.materiaId,
            publicacionId: data.publicacionId 
          },
        });
      }
    }
  );

  return subscription;
}

/**
 * Limpiar todas las notificaciones de la barra
 */
export async function limpiarNotificaciones() {
  if (!Notifications) return;
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Obtener badge count actual
 */
export async function obtenerBadgeCount() {
  if (!Notifications) return 0;
  return await Notifications.getBadgeCountAsync();
}

/**
 * Establecer badge count
 */
export async function establecerBadgeCount(count: number) {
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count);
}
