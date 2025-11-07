import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const NOTIFICATION_SETTINGS_KEY = "notificationSettings";

export interface NotificationSettings {
  fcmEnabled: boolean;
  localNotificationsEnabled: boolean;
  newPublicationsEnabled: boolean;
  newSubjectsEnabled: boolean;
  commentsEnabled: boolean;
  likesEnabled: boolean;
  adminAlertsEnabled: boolean;
  sound: boolean;
  vibration: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  fcmEnabled: true,
  localNotificationsEnabled: true,
  newPublicationsEnabled: true,
  newSubjectsEnabled: true,
  commentsEnabled: true,
  likesEnabled: true,
  adminAlertsEnabled: true,
  sound: true,
  vibration: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { settings, isLoading };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error loading notification settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function shouldSendNotification(type: 'publication' | 'subject' | 'comment' | 'like' | 'adminAlert'): boolean | undefined {
  return undefined;
}
