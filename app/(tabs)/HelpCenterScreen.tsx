import { useTheme } from "@/contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Text
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Admin {
  name: string;
  email: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function HelpCenterScreen() {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const admins: Admin[] = [
    {
      name: 'Marko',
      email: 'marcosvelasquezvela20020509@gmail.com',
      icon: 'account',
    },
    {
      name: 'Daniel',
      email: 'virreira.daniel@gmail.com',
      icon: 'account',
    },
    {
      name: 'Steven',
      email: 'steven18122004@gmail.com',
      icon: 'account',
    },
    {
      name: 'Victor',
      email: 'victorterrazasc05@gmail.com',
      icon: 'account',
    },
  ];

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleCopyEmail = (email: string) => {
    // Copiar al portapapeles
    require('react-native').NativeModules.Clipboard?.setString(email);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? theme.colors.surface : theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Centro de Contactos" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <MaterialCommunityIcons 
            name="email-multiple" 
            size={48} 
            color={theme.colors.primary}
            style={styles.headerIcon}
          />
          <Text variant="headlineSmall" style={[styles.headerText, { color: theme.colors.primary }]}>
            Conecta con Nosotros
          </Text>
          <Text variant="bodyMedium" style={[styles.descriptionText, { color: theme.colors.onSurfaceVariant }]}>
            Contacta a cualquiera de nuestros administradores
          </Text>
        </View>

        <View style={styles.adminsList}>
          {admins.map((admin, index) => (
            <Pressable
              key={index}
              onPress={() => handleEmailPress(admin.email)}
              style={({ pressed }) => [
                styles.adminCard,
                {
                  backgroundColor: isDark ? theme.colors.elevation.level2 : theme.colors.surface,
                  opacity: pressed ? 0.7 : 1,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <View style={styles.adminContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name={admin.icon}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.adminInfo}>
                  <Text variant="titleMedium" style={[styles.adminName, { color: theme.colors.onSurface }]}>
                    {admin.name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.adminEmail, { color: theme.colors.onSurfaceVariant }]}>
                    {admin.email}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerText: {
    marginBottom: 8,
    fontWeight: '600',
  },
  descriptionText: {
    textAlign: 'center',
  },
  adminsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  adminCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 8,
  },
  adminContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 12,
  },
});