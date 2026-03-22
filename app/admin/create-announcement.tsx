import { useTheme } from "@/contexts/ThemeContext";
import { auth, db, storage } from "@/firebase";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Dialog, Portal, Switch, Text, TextInput } from "react-native-paper";

export default function AnnouncementFormScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const announcementId: string = route?.params?.announcementId || "";
  const isEditMode = Boolean(announcementId);

  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [activo, setActivo] = useState(true);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      setLoadingData(false);
      return;
    }

    let cancelled = false;
    const loadAnnouncement = async () => {
      try {
        const snap = await getDoc(doc(db, "anuncios", announcementId));
        if (!snap.exists()) {
          navigation.goBack();
          return;
        }
        if (cancelled) return;
        const data = snap.data() as any;
        setTitulo(String(data?.titulo || ""));
        setMensaje(String(data?.mensaje || ""));
        setImagenUrl(String(data?.imagenUrl || ""));
        setActivo(Boolean(data?.activo));
      } catch (error) {
        console.error("Error cargando anuncio:", error);
        if (!cancelled) navigation.goBack();
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    void loadAnnouncement();
    return () => {
      cancelled = true;
    };
  }, [announcementId, isEditMode, navigation]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.92,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const localUri = result.assets[0]?.uri;
      if (!localUri) return;
      setImagenUrl(localUri);
    } catch (error) {
      console.error("Error seleccionando imagen del anuncio:", error);
    }
  };

  const uploadLocalImageAndGetUrl = async (localUri: string) => {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filename = `anuncios/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  const saveAnnouncement = async () => {
    const trimmedTitle = titulo.trim();
    const trimmedMessage = mensaje.trim();
    if (!trimmedTitle || !trimmedMessage) return;

    setSaving(true);
    try {
      let finalImageUrl = imagenUrl.trim();
      if (finalImageUrl && !finalImageUrl.startsWith("http")) {
        setUploadingImage(true);
        finalImageUrl = await uploadLocalImageAndGetUrl(finalImageUrl);
      }

      if (isEditMode) {
        await updateDoc(doc(db, "anuncios", announcementId), {
          titulo: trimmedTitle,
          mensaje: trimmedMessage,
          imagenUrl: finalImageUrl || "",
          activo,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || null,
        });
      } else {
        await addDoc(collection(db, "anuncios"), {
          titulo: trimmedTitle,
          mensaje: trimmedMessage,
          imagenUrl: finalImageUrl || "",
          activo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || null,
          updatedBy: auth.currentUser?.uid || null,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "actualizando" : "guardando"} anuncio:`,
        error,
      );
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  const deleteAnnouncement = async () => {
    if (!isEditMode || !announcementId) return;
    try {
      setSaving(true);
      await deleteDoc(doc(db, "anuncios", announcementId));
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error("Error eliminando anuncio:", error);
    } finally {
      setSaving(false);
    }
  };

  const disableActions = saving || uploadingImage || loadingData;
  const disableSave = disableActions || !titulo.trim() || !mensaje.trim();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditMode ? "Editar anuncio" : "Nuevo anuncio"} />
        <Button
          mode="contained"
          onPress={saveAnnouncement}
          disabled={disableSave}
          loading={saving || uploadingImage}
          style={styles.headerSaveButton}
          contentStyle={styles.headerSaveButtonContent}
          labelStyle={styles.headerSaveLabel}
        >
          {isEditMode ? "Guardar" : "Crear"}
        </Button>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          label="Título"
          mode="outlined"
          value={titulo}
          onChangeText={setTitulo}
          maxLength={120}
          style={styles.input}
          disabled={disableActions}
        />
        <TextInput
          label="Mensaje"
          mode="outlined"
          value={mensaje}
          onChangeText={setMensaje}
          multiline
          numberOfLines={5}
          maxLength={1000}
          disabled={disableActions}
        />
        <View style={styles.imageActions}>
          <Button mode="outlined" onPress={pickImage} disabled={disableActions}>
            {imagenUrl ? "Cambiar foto" : "Agregar foto"}
          </Button>
          {imagenUrl ? (
            <Button
              mode="text"
              onPress={() => setImagenUrl("")}
              disabled={disableActions}
              textColor={theme.colors.error}
            >
              Quitar
            </Button>
          ) : null}
        </View>
        {imagenUrl ? (
          <Image source={{ uri: imagenUrl }} style={styles.previewImage} resizeMode="cover" />
        ) : null}

        <View style={styles.switchRow}>
          <Text variant="bodyMedium">Anuncio activo</Text>
          <Switch value={activo} onValueChange={setActivo} disabled={disableActions} />
        </View>

        {isEditMode ? (
          <View style={styles.deleteRow}>
            <Button
              mode="text"
              onPress={() => setDeleteDialogVisible(true)}
              disabled={disableActions}
              textColor={theme.colors.error}
            >
              Eliminar anuncio
            </Button>
          </View>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => {
            if (!saving) setDeleteDialogVisible(false);
          }}
          dismissable={!saving}
        >
          <Dialog.Title>Eliminar anuncio</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Esta accion no se puede deshacer. Quieres continuar?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDeleteDialogVisible(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onPress={deleteAnnouncement}
              textColor={theme.colors.error}
              loading={saving}
              disabled={saving}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  headerSaveLabel: {
    textTransform: "none",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0,
  },
  headerSaveButton: {
    borderRadius: 999,
    marginRight: 10,
    minWidth: 96,
    alignSelf: "center",
  },
  headerSaveButtonContent: {
    height: 38,
    paddingHorizontal: 6,
  },
  input: {
    marginBottom: 10,
  },
  imageActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewImage: {
    marginTop: 10,
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  switchRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteRow: {
    marginTop: 10,
    alignItems: "flex-start",
  },
});
