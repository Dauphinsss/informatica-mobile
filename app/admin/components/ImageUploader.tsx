// app/admin/components/ImageUploader.tsx
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
}) => {
  const [image, setImage] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();

  // 🎭 MOCK: Imágenes de ejemplo para simular selección
  const mockImages = [
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
  ];

  // 🎭 MOCK: Simular selección de imagen
  const pickImage = async () => {
    try {
      setUploading(true);

      // Simular delay de selección
      await new Promise(resolve => setTimeout(resolve, 500));

      // Seleccionar una imagen aleatoria
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      
      setImage(randomImage);
      
      // Simular subida a Firebase
      await uploadImage(randomImage);
      
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
      setUploading(false);
    }
  };

  // 🎭 MOCK: Simular subida a Firebase
  const uploadImage = async (uri: string) => {
    try {
      // Simular delay de subida
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular URL de Firebase (en realidad es la misma URL)
      const mockFirebaseUrl = uri;
      
      onImageUploaded(mockFirebaseUrl);
      
      Alert.alert('✅ Simulación exitosa', 'Imagen "subida" correctamente (MOCK)');
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Alert.alert('Error', 'No se pudo subir la imagen.');
      setImage(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    onImageRemoved();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="labelLarge" style={styles.label}>
          Imagen de la materia
        </Text>
        <Text variant="bodySmall" style={[styles.mockBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
          🎭 MODO DEMO
        </Text>
      </View>
      
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <View style={styles.overlay}>
            <View style={styles.overlayButtons}>
              <Button 
                mode="contained" 
                onPress={pickImage} 
                style={styles.button}
                compact
                icon="image"
                disabled={uploading}
              >
                Cambiar
              </Button>
              <Button 
                mode="outlined" 
                onPress={removeImage} 
                style={[styles.button, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
                compact
                icon="delete"
                disabled={uploading}
              >
                Eliminar
              </Button>
            </View>
          </View>
          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Subiendo imagen...</Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          <Button 
            mode="outlined" 
            onPress={pickImage} 
            loading={uploading}
            disabled={uploading}
            icon="image-plus"
            style={styles.uploadButton}
          >
            {uploading ? 'Subiendo...' : 'Seleccionar imagen (DEMO)'}
          </Button>
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.secondary }]}>
            💡 En modo demo: se seleccionará una imagen de ejemplo
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  mockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    marginHorizontal: 4,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  hint: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '600',
  },
});

export default ImageUploader;