import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Button, Card, Text } from "react-native-paper";

type IconKey = "default" | "elecciones";

type IconOption = {
  key: IconKey;
  title: string;
  source: any;
};

const ICON_OPTIONS: IconOption[] = [
  {
    key: "default",
    title: "Icono normal",
    source: require("../../assets/images/icon.png"),
  },
  {
    key: "elecciones",
    title: "Icono elecciones",
    source: require("../../assets/images/elecciones.png"),
  },
];

export default function ManageAppIconScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconKey>("default");
  const [savedIcon, setSavedIcon] = useState<IconKey>("default");

  useEffect(() => {
    const configRef = doc(db, "configuracionSistema", "launcherIcon");
    const unsub = onSnapshot(
      configRef,
      (snapshot) => {
        const data = snapshot.data() as { activeIconKey?: string } | undefined;
        const next = data?.activeIconKey === "elecciones" ? "elecciones" : "default";
        setSelectedIcon(next);
        setSavedIcon(next);
        setLoading(false);
      },
      (error) => {
        console.error("Error leyendo configuracion de icono:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const saveIconConfig = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "configuracionSistema", "launcherIcon"),
        {
          activeIconKey: selectedIcon,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || null,
        },
        { merge: true },
      );
      setSavedIcon(selectedIcon);
    } catch (error) {
      console.error("Error guardando configuracion de icono:", error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedIcon !== savedIcon;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Icono" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.optionsList}>
            {ICON_OPTIONS.map((option) => {
              const isActive = option.key === selectedIcon;
              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedIcon(option.key)}
                >
                  <Card
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.colors.elevation.level1,
                        borderColor: isActive ? theme.colors.primary : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <Card.Content style={styles.optionContent}>
                      <Image source={option.source} style={styles.iconPreview} resizeMode="contain" />
                      <View style={styles.optionText}>
                        <Text variant="titleMedium" style={styles.optionTitle}>
                          {option.title}
                        </Text>
                      </View>
                      {isActive ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={22}
                          color={theme.colors.primary}
                        />
                      ) : null}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Button
          mode="contained"
          onPress={saveIconConfig}
          loading={saving}
          disabled={saving || loading || !hasChanges}
          style={styles.saveButton}
        >
          Guardar
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  loadingWrap: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconPreview: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 999,
  },
});
