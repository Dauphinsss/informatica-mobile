import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageSelected?: (localUri: string) => void;
  onImageRemoved?: () => void;
  uploading?: boolean;
}

const CARD_ASPECT_RATIO: [number, number] = [21, 9];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const CARD_ASPECT = CARD_ASPECT_RATIO[0] / CARD_ASPECT_RATIO[1];

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageSelected,
  onImageRemoved,
  uploading = false,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(currentImageUrl || null);
  const theme = useTheme();

  useEffect(() => {
    setImageUri(currentImageUrl || null);
  }, [currentImageUrl]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: CARD_ASPECT_RATIO,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const size = asset.fileSize ?? (asset as any).fileSize ?? (asset as any).size ?? null;

      if (!uri) {
        Alert.alert("Error", "No se pudo obtener la imagen seleccionada.");
        return;
      }

      if (size && size > MAX_FILE_SIZE_BYTES) {
        Alert.alert("Error", "La imagen es muy grande. Maximo 5MB.");
        return;
      }

      setImageUri(uri);

      if (typeof onImageSelected === "function") {
        try {
          onImageSelected(uri);
        } catch (callErr) {
          console.error("onImageSelected threw:", callErr);
        }
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error);
      Alert.alert(
        "Error",
        "No se pudo seleccionar la imagen. Si tu dispositivo lo requiere, habilita el acceso a Fotos/Archivos en Ajustes."
      );
    }
  };

  const handleRemove = () => {
    Alert.alert("Confirmar", "Estas seguro de eliminar esta imagen?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          setImageUri(null);
          if (typeof onImageRemoved === "function") {
            try {
              onImageRemoved();
            } catch (err) {
              console.error("onImageRemoved threw:", err);
            }
          }
        },
      },
    ]);
  };

  const isRemote = !!imageUri && (imageUri.startsWith("http://") || imageUri.startsWith("https://"));

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Imagen de la materia
      </Text>

      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

          <View style={styles.overlay}>
            <View style={styles.overlayButtons}>
              <Button
                mode="contained"
                onPress={pickImage}
                style={styles.button}
                compact
                icon="camera"
                disabled={uploading}
              >
                Cambiar
              </Button>
              <Button
                mode="outlined"
                onPress={handleRemove}
                style={[styles.button, { backgroundColor: "rgba(255,255,255,0.95)" }]}
                compact
                icon="delete"
                disabled={uploading}
                textColor="#B00020"
              >
                Eliminar
              </Button>
            </View>

            {!isRemote && !uploading && (
              <View style={{ marginTop: 8 }}>
                <Text variant="bodySmall" style={{ color: "white" }}>
                  Imagen seleccionada (recortada al formato 21:9)
                </Text>
              </View>
            )}
          </View>

          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Subiendo imagen...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Button
            mode="outlined"
            onPress={pickImage}
            loading={uploading}
            disabled={uploading}
            icon="image-plus"
            style={styles.uploadButton}
          >
            {uploading ? "Subiendo..." : "Seleccionar imagen"}
          </Button>
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.secondary }]}>
            Formato recortado 21:9, tamano maximo 5MB.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  label: { marginBottom: 8, fontWeight: "600" },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: "100%", aspectRatio: CARD_ASPECT },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayButtons: { flexDirection: "row", gap: 8 },
  button: { marginHorizontal: 4 },
  emptyContainer: { alignItems: "flex-start" },
  uploadButton: { marginBottom: 8 },
  hint: { fontStyle: "italic", fontSize: 12 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "white", marginTop: 12, fontWeight: "600", fontSize: 14 },
});

export default ImageUploader;
