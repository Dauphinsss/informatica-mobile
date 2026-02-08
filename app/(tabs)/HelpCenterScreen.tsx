import { ActivityListSkeleton } from "@/app/admin/components/SkeletonLoaders";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Avatar, Surface, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Admin {
  name: string;
  email: string;
  photo?: string;
}

export default function HelpCenterScreen() {
  const { isDark, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminEmails = [
          "marcosvelasquezvela20020509@gmail.com",
          "steven18122004@gmail.com",
          "victorterrazasc05@gmail.com",
          "virreiradaniel@gmail.com",
        ];

        const q = query(
          collection(db, "usuarios"),
          where("correo", "in", adminEmails),
        );

        const snapshot = await getDocs(q);
        const adminData: Admin[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          adminData.push({
            name: data.nombre || "Admin",
            email: data.correo,
            photo: data.foto || "",
          });
        });

        setAdmins(adminData);
      } catch (error) {
        console.error("Error cargando admins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: isDark
            ? theme.colors.surface
            : theme.colors.background,
        },
      ]}
    >
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
          <Text
            variant="headlineSmall"
            style={[styles.headerText, { color: theme.colors.primary }]}
          >
            Conecta con Nosotros
          </Text>
          <Text
            variant="bodyMedium"
            style={[
              styles.descriptionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Contacta a cualquiera de nuestros administradores
          </Text>
        </View>

        <View style={styles.adminsList}>
          {loading ? (
            <ActivityListSkeleton count={4} />
          ) : (
            admins.map((admin, index) => (
              <Surface key={index} elevation={2} style={styles.adminCard}>
                <Pressable
                  onPress={() => handleEmailPress(admin.email)}
                  style={({ pressed }) => [
                    styles.adminPressable,
                    {
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.adminContent}>
                    <View style={{ position: "relative" }}>
                      {admin.photo ? (
                        <Avatar.Image size={48} source={{ uri: admin.photo }} />
                      ) : (
                        <Avatar.Icon
                          size={48}
                          icon="account"
                          style={{
                            backgroundColor: theme.colors.primaryContainer,
                          }}
                        />
                      )}
                      <AdminBadge size={48} isAdmin={true} />
                    </View>
                    <View style={styles.adminInfo}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.adminName,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {admin.name}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.adminEmail,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
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
              </Surface>
            ))
          )}
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
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerText: {
    marginBottom: 8,
    fontWeight: "600",
  },
  descriptionText: {
    textAlign: "center",
  },
  adminsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  adminCard: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 1,
    overflow: "hidden",
  },
  adminPressable: {
    padding: 16,
  },
  adminContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 12,
  },
});
