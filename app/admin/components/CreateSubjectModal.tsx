import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { Button, Divider, Menu, Modal, Text, TextInput, useTheme } from 'react-native-paper';
import { storage } from '../../../firebase';
import ImageUploader from './ImageUploader';

interface CreateSubjectModalProps {
  visible: boolean;
  onDismiss: () => void;
  formData: {
    nombre: string;
    descripcion: string;
    semestre: string;
    imagenUrl?: string;
  };
  setFormData: (data: any) => void;
  errors: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  loading: boolean;
  onSave: (finalData?: any) => void | Promise<void>;
  isSaveDisabled: boolean;
}

const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Electiva'];

const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  visible,
  onDismiss,
  formData,
  setFormData,
  errors,
  loading,
  onSave,
  isSaveDisabled,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Cerrar teclado cuando se abre el modal
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  // ... (rest of your functions remain the same)

  // Función para hacer scroll cuando un input se enfoca
  const handleInputFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const selectSemestre = (semestre: string) => {
    if (semestre === 'Electiva') {
      setFormData({ ...formData, semestre: '10' });
    } else {
      setFormData({ ...formData, semestre: semestre.toString() });
    }
    closeMenu();
  };

  const handleImageSelected = (localUri: string) => {
    setFormData({ ...formData, imagenUrl: localUri });
  };

  const handleImageRemoved = () => {
    setFormData({ ...formData, imagenUrl: undefined });
  };

  const getSemestreText = (semestre: string) => {
    return semestre === '10' ? 'Electiva' : `Semestre ${semestre}`;
  };

  const optionValue = (opt: number | string) => {
    if (opt === 'Electiva') return '10';
    return String(opt);
  };

  const handleSave = async () => {
    if (uploadingImage) return;

    let finalData = { ...formData };

    try {
      const img = formData.imagenUrl;

      if (img && !(img.startsWith('http://') || img.startsWith('https://'))) {
        setUploadingImage(true);
        try {
          const response = await fetch(img);
          const blob = await response.blob();
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const filename = `materias/${timestamp}-${randomStr}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(storageRef);
          finalData = { ...formData, imagenUrl: downloadUrl };
          setFormData(finalData);
        } catch (uploadError) {
          console.error('Error subiendo imagen desde modal:', uploadError);
        } finally {
          setUploadingImage(false);
        }
      }

      try {
        const maybePromise = onSave(finalData);
        if (maybePromise && typeof (maybePromise as any).then === 'function') {
          await maybePromise;
        }
      } catch (callErr) {
        console.error('onSave threw an error:', callErr);
      }
    } catch (error) {
      console.error('Error en handleSave:', error);
      try {
        onSave(finalData);
      } catch (e) {
        console.error('onSave fallback error:', e);
      }
    }
  };

  const selectedValue = formData?.semestre ? String(formData.semestre) : '';

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.modalTitle}>
          Nueva Materia
        </Text>

        <ImageUploader
          currentImageUrl={formData.imagenUrl}
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
          uploading={uploadingImage}
        />

        <View style={styles.inputContainer}>
          <TextInput
            label="Nombre de la materia *"
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            error={!!errors.nombre}
            style={styles.input}
            maxLength={30}
            mode="outlined"
            onFocus={() => handleInputFocus(100)}
          />
          {errors.nombre ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.nombre}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Descripción breve *"
            value={formData.descripcion}
            onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
            error={!!errors.descripcion}
            style={styles.input}
            multiline
            numberOfLines={3}
            mode="outlined"
            onFocus={() => handleInputFocus(200)}
            returnKeyType="done"
          />
          {errors.descripcion ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.descripcion}</Text> : null}
        </View>

        <View style={styles.semestreContainer}>
          <Text variant="labelLarge" style={styles.semestreLabel}>
            Semestre *
          </Text>

          <Menu
            key={String(formData.semestre ?? '')}
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <View style={{ width: '100%' }}>
                <Button
                  mode="outlined"
                  onPress={openMenu}
                  style={styles.semestreButton}
                  icon="chevron-down"
                  contentStyle={styles.semestreButtonContent}
                >
                  {formData.semestre ? getSemestreText(formData.semestre) : 'Seleccionar semestre'}
                </Button>
              </View>
            }
            style={{ zIndex: 9999 }}
          >
            {semestres
              .filter((sem) => optionValue(sem) !== selectedValue)
              .map((semestre, index) => (
                <React.Fragment key={`${semestre}-${index}`}>
                  <Menu.Item
                    onPress={() => selectSemestre(semestre.toString())}
                    title={semestre === 'Electiva' ? 'Electiva' : `Semestre ${semestre}`}
                  />
                  {index < semestres.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </Menu>
        </View>
        {errors.semestre ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.semestre}</Text> : null}

        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.button}
            disabled={loading || uploadingImage}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            disabled={isSaveDisabled || loading || uploadingImage}
            loading={loading || uploadingImage}
          >
            Guardar
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = {
  modal: { 
    margin: 20,
    borderRadius: 8,
    maxHeight: '85%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: { 
    padding: 24,
    paddingBottom: 90,
  },
  modalTitle: { 
    marginBottom: 20, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: { 
    marginBottom: 4 
  },
  errorText: { 
    fontSize: 12, 
    marginBottom: 12, 
    marginLeft: 4, 
    fontWeight: '500' 
  },
  semestreContainer: { 
    marginBottom: 16 
  },
  semestreLabel: { 
    marginBottom: 8 
  },
  semestreButton: { 
    width: '100%' 
  },
  semestreButtonContent: { 
    flexDirection: 'row-reverse', 
    justifyContent: 'space-between' 
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12, 
    marginTop: 16 
  },
  button: { 
    minWidth: 100 
  },
} as const;

export default CreateSubjectModal;