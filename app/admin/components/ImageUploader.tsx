import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';

interface ImageUploaderProps {
  currentImageUrl?: string; // puede ser url remota o uri local (staging)
  onImageSelected?: (localUri: string) => void; // ahora opcional (no sube)
  onImageRemoved?: () => void;
  uploading?: boolean; // indica que el parent está subiendo la imagen al backend
}

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
      const result: any = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      // Guard: consideramos "success" si hay URI en alguna forma conocida
      const isSuccessResult = (r: any) =>
        !!(
          r?.uri ||
          r?.fileUri ||
          r?.file?.uri ||
          (Array.isArray(r?.assets) && r.assets.length > 0 && r.assets[0]?.uri)
        );

      if (!isSuccessResult(result)) {
        // usuario canceló o no hay uri — tratamos como cancel
        return;
      }

      const anyRes = result as any;

      const uri =
        anyRes.uri ||
        anyRes.fileUri ||
        anyRes.file?.uri ||
        (Array.isArray(anyRes.assets) ? anyRes.assets[0]?.uri : undefined);

      const name = anyRes.name || anyRes.fileName || (Array.isArray(anyRes.assets) ? anyRes.assets[0]?.name : '');
      const mimeType = anyRes.mimeType || anyRes.type || (Array.isArray(anyRes.assets) ? anyRes.assets[0]?.mimeType : undefined);
      const size = anyRes.size || anyRes.fileSize || (Array.isArray(anyRes.assets) ? anyRes.assets[0]?.size : undefined);

      if (!uri) {
        Alert.alert('Error', 'No se seleccionó ninguna imagen.');
        return;
      }

      if (mimeType && !mimeType.startsWith('image/')) {
        Alert.alert('Error', 'Por favor selecciona una imagen válida.');
        return;
      } else if (!mimeType && name) {
        const ext = name.split('.').pop()?.toLowerCase() || '';
        const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        if (!validExts.includes(ext)) {
          Alert.alert('Error', 'Por favor selecciona una imagen (JPG/PNG/... ).');
          return;
        }
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (size && size > maxSize) {
        Alert.alert('Error', 'La imagen es muy grande. Máximo 5MB.');
        return;
      }

      // Preview local
      setImageUri(uri);

      // Llamada segura: solo si la prop existe
      if (typeof onImageSelected === 'function') {
        try {
          onImageSelected(uri);
        } catch (callErr) {
          // prevenir crash si el parent lanza error al recibir la uri
          console.error('onImageSelected threw:', callErr);
        }
      } else {
        // Log informativo para debugging (no rompe la app)
        console.warn('ImageUploader: onImageSelected prop no está definida. Actualiza el padre para recibir el URI seleccionado.');
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleRemove = async () => {
    try {
      Alert.alert('Confirmar', '¿Estás seguro de eliminar esta imagen?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setImageUri(null);
            if (typeof onImageRemoved === 'function') {
              try {
                onImageRemoved();
              } catch (err) {
                console.error('onImageRemoved threw:', err);
              }
            } else {
              console.warn('ImageUploader: onImageRemoved prop no está definida.');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error eliminando imagen:', error);
    }
  };

  const isRemote = !!imageUri && (imageUri.startsWith('http://') || imageUri.startsWith('https://'));

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>Imagen de la materia</Text>

      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

          <View style={styles.overlay}>
            <View style={styles.overlayButtons}>
              <Button mode="contained" onPress={pickImage} style={styles.button} compact icon="camera" disabled={uploading}>
                Cambiar
              </Button>
              <Button mode="outlined" onPress={handleRemove} style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.95)' }]} compact icon="delete" disabled={uploading} textColor="#B00020">
                Eliminar
              </Button>
            </View>

            {!isRemote && !uploading && (
              <View style={{ marginTop: 8 }}>
                <Text variant="bodySmall" style={{ color: 'white' }}>Imagen seleccionada (aún no subida)</Text>
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
          <Button mode="outlined" onPress={pickImage} loading={uploading} disabled={uploading} icon="image-plus" style={styles.uploadButton}>
            {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
          </Button>
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.secondary }]}>Formatos: JPG, PNG. Máximo 5MB</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  label: { marginBottom: 8, fontWeight: '600' },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: '100%', height: 200 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  overlayButtons: { flexDirection: 'row', gap: 8 },
  button: { marginHorizontal: 4 },
  emptyContainer: { alignItems: 'flex-start' },
  uploadButton: { marginBottom: 8 },
  hint: { fontStyle: 'italic', fontSize: 12 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 12, fontWeight: '600', fontSize: 14 },
});

export default ImageUploader;
