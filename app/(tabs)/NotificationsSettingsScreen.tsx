import { useTheme } from "@/contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import {
    Appbar,
    Card,
    Divider,
    Surface,
    Switch,
    Text,
} from "react-native-paper";

const NOTIFICATION_SETTINGS_KEY = "notificationSettings";

interface NotificationSettings {
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

const DEFAULT_SETTINGS: NotificationSettings = {
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

export default function NotificationsSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.stagger(80, [
          Animated.spring(slideAnim1, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim2, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim3, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isLoading]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleFCMToggle = (value: boolean) => {
    const newSettings = { ...settings, fcmEnabled: value };
    saveSettings(newSettings);
  };

  const handleLocalToggle = (value: boolean) => {
    const newSettings = { ...settings, localNotificationsEnabled: value };
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header>
          <Appbar.Content title="Notificaciones" />
        </Appbar.Header>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Notificaciones" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim1 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="bell-ring"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Tipos de Notificaciones
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Notificaciones FCM
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Alertas del sistema
                  </Text>
                </View>
                <Switch
                  value={settings.fcmEnabled}
                  onValueChange={handleFCMToggle}
                  color={theme.colors.primary}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Notificaciones Locales
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Alertas en la aplicación
                  </Text>
                </View>
                <Switch
                  value={settings.localNotificationsEnabled}
                  onValueChange={handleLocalToggle}
                  color={theme.colors.primary}
                />
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim2 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="cog-box"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Contenido
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Nuevas Publicaciones
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Materias suscritas
                  </Text>
                </View>
                <Switch
                  value={settings.newPublicationsEnabled}
                  onValueChange={() => toggleSetting("newPublicationsEnabled")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Nuevas Materias
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Tu semestre académico
                  </Text>
                </View>
                <Switch
                  value={settings.newSubjectsEnabled}
                  onValueChange={() => toggleSetting("newSubjectsEnabled")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Comentarios en mis Posts
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Cuando alguien comenta
                  </Text>
                </View>
                <Switch
                  value={settings.commentsEnabled}
                  onValueChange={() => toggleSetting("commentsEnabled")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Likes en mis Posts
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Cuando alguien da like
                  </Text>
                </View>
                <Switch
                  value={settings.likesEnabled}
                  onValueChange={() => toggleSetting("likesEnabled")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim3 }],
            },
          ]}
        >
          <Card elevation={1} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="volume-high"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Comportamiento
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Sonido
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Reproducir sonido
                  </Text>
                </View>
                <Switch
                  value={settings.sound}
                  onValueChange={() => toggleSetting("sound")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Vibración
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Vibrar al recibir
                  </Text>
                </View>
                <Switch
                  value={settings.vibration}
                  onValueChange={() => toggleSetting("vibration")}
                  color={theme.colors.primary}
                  disabled={!settings.localNotificationsEnabled && !settings.fcmEnabled}
                />
              </View>

              <Divider style={styles.itemDivider} />

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text variant="bodyMedium" style={styles.settingTitle}>
                    Alertas del Admin
                  </Text>
                  <Text variant="bodySmall" style={styles.settingDesc}>
                    Decisiones sobre tu cuenta
                  </Text>
                </View>
                <Switch
                  value={settings.adminAlertsEnabled}
                  onValueChange={() => toggleSetting("adminAlertsEnabled")}
                  color={theme.colors.primary}
                />
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <View style={styles.infoBox}>
          <Surface
            style={[
              styles.infoSurface,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            elevation={0}
          >
            <MaterialCommunityIcons
              name="information"
              size={16}
              color={theme.colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text variant="bodySmall" style={styles.infoText}>
              Desactiva todos los tipos para no recibir ninguna notificación
            </Text>
          </Surface>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "600",
  },
  divider: {
    marginVertical: 12,
  },
  itemDivider: {
    marginVertical: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDesc: {
    opacity: 0.6,
  },
  infoBox: {
    marginBottom: 40,
    marginTop: 8,
  },
  infoSurface: {
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    opacity: 0.8,
  },
});
