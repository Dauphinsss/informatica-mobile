import { db } from '@/firebase';
import { getExpoPushTokenAsync } from 'expo-notifications';
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { navigate, openSubjectsModal } from './navigationService';

let Device: any;
let Notifications: any;

try {
  Device = require('expo-device');
  Notifications = require('expo-notifications');
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Módulos de notificaciones no disponibles (Expo Go)');
}

{/*
  Solicitar permisos de notificaciones
*/}
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

{/*
  Configurar canal de notificaciones para Android
*/}
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

{/*
  Notificaciones locales
*/}

export async function obtenerExpoPushToken(): Promise<string | null> {
  if (!Device || !Notifications) return null;
  
  try {
    const tokenData = await getExpoPushTokenAsync({
      projectId: '7c7b0c2f-b147-414d-90e9-e80c65c42571',
    });
    console.log('Token de Expo obtenido en Expo Go:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.log('Error al obtener el token de Expo:', error);
    return null;
  }
}

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
    console.log('Notificación local enviada:', titulo);
  } catch (error) {
    console.log('Error al enviar notificación local:', error);
  }
}

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

{/*
  Servicio de notificaciones push fcm
*/}

export async function obtenerFCMToken() {
  if (Device.isDevice) {
    try {
      const fcmToken = await Notifications.getDevicePushTokenAsync();
      return fcmToken.data;
    } catch (error) {
      console.log('Error al obtener el token FCM', error);
      return null;
    }
  }
  return null;
}

export async function registrarTokens(uid: string, expoToken: string, fcmToken: string) {
  const userRef = doc(db, 'usuarios', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      rol: 'usuario',
      tokens: [expoToken],    
      pushTokens: [fcmToken],
    });
  } else {
    await updateDoc(userRef, {
      tokens: arrayUnion(expoToken),
      pushTokens: arrayUnion(fcmToken),  
    });
  }
}

export async function registrarTokensUsuario(uid: string) {
  const expoToken = await obtenerExpoPushToken();
  const fcmToken = await obtenerFCMToken();

  if (expoToken && fcmToken) {
    await registrarTokens(uid, expoToken, fcmToken);
  }
}

export function configurarListenerNotificaciones() {
  if (!Notifications) return;

  Notifications.addNotificationResponseReceivedListener((response: any) => {
    const data = response.notification.request.content.data;

    if (data.accion === 'ver_materia' && data.materiaId) {
      navigate('Home', { screen: 'HomeMain' });
      setTimeout(() => {
        openSubjectsModal();
      }, 300);
    }
  });
}
