import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface NotificationSettings {
  newPublicationsEnabled: boolean;
  newSubjectsEnabled: boolean;
  adminAlertsEnabled: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  newPublicationsEnabled: true,
  newSubjectsEnabled: true,
  adminAlertsEnabled: true,
};

/**
 * Obtiene las configuraciones de notificaciones desde Firestore
 * Si no existen, retorna DEFAULT_SETTINGS
 */
export async function getNotificationSettings(userId?: string): Promise<NotificationSettings> {
  try {
    let uid = userId;
    
    // Si no se proporciona userId, obtenerlo del usuario actual
    if (!uid) {
      const auth = getAuth();
      uid = auth.currentUser?.uid;
    }
    
    if (!uid) {
      return DEFAULT_SETTINGS;
    }

    const settingsRef = doc(db, 'notificationSettings', uid);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as NotificationSettings;
      return data;
    }

    // Si no existen configuraciones, retornar defaults SIN crear el documento
    // (el documento se creará cuando el usuario entre a configuración)
    return DEFAULT_SETTINGS;
  } catch (error) {
    // En caso de error de permisos u otro, retornar defaults
    return DEFAULT_SETTINGS;
  }
}

/**
 * Guarda las configuraciones de notificaciones en Firestore
 */
export async function saveNotificationSettings(
  settings: NotificationSettings,
  userId?: string
): Promise<void> {
  try {
    let uid = userId;
    
    if (!uid) {
      const auth = getAuth();
      uid = auth.currentUser?.uid;
    }
    
    if (!uid) {
      return;
    }

    const settingsRef = doc(db, 'notificationSettings', uid);
    await setDoc(settingsRef, settings, { merge: true });
  } catch (error) {
    console.error("[Settings] Error saving notification settings:", error);
    throw error;
  }
}
