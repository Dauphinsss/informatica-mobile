import { useTheme } from "@/contexts/ThemeContext";
import {
    getNotificationSettings,
    saveNotificationSettings,
    type NotificationSettings
} from "@/hooks/useNotificationSettings";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsSettingsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [settings, setSettings] = useState<NotificationSettings>({
    newPublicationsEnabled: true,
    newSubjectsEnabled: true,
    adminAlertsEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const settingsBackupRef = useRef<NotificationSettings>(settings);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const insets = useSafeAreaInsets();

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
        Animated.spring(slideAnim1, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const loadSettings = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No hay usuario autenticado');
        setIsLoading(false);
        return;
      }

      const savedSettings = await getNotificationSettings(userId);
      const settingsWithAdmin = { ...savedSettings, adminAlertsEnabled: true };
      setSettings(settingsWithAdmin);
      settingsBackupRef.current = settingsWithAdmin;
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No hay usuario autenticado');
        return;
      }

      const settingsToSave = { ...newSettings, adminAlertsEnabled: true };
      await saveNotificationSettings(settingsToSave, userId);
      settingsBackupRef.current = settingsToSave;
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setSettings(settingsBackupRef.current);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveSettings(newSettings);
      debounceTimerRef.current = null;
    }, 500);
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Notificaciones" />
        </Appbar.Header>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
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
              Desactiva las opciones que prefieras para personalizar tus notificaciones
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

{/* No habrán configuración de sonido y vibración debido a la complejidad del mismo y los bugs que ocasiona */}
