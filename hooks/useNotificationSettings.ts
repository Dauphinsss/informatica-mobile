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


export async function getNotificationSettings(userId?: string): Promise<NotificationSettings> {
  try {
    let uid = userId;
    
    
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

    
    
    return DEFAULT_SETTINGS;
  } catch (error) {
    
    return DEFAULT_SETTINGS;
  }
}


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
