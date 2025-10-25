import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Dialog, Modal, Portal, RadioButton, Text, TextInput, useTheme } from 'react-native-paper';
import { storage } from '../../../firebase';
import ImageUploader from './ImageUploader';

interface CreateSubjectModalProps {
  visible: boolean;
  onDismiss: () => void;
  formData: {
    nombre: string;
    descripcion: string;
    semestre: string; // almacenamos "10" para Electiva
    imagenUrl?: string; // puede ser URL remota (http...) o uri local (staging)
  };
  setFormData: (data: any) => void;
  errors: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  loading: boolean; // loading general (por ejemplo durante guardado de la entidad)
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
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [semestrePickerVisible, setSemestrePickerVisible] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setSemestrePickerVisible(false);
    }
  }, [visible]);

  const openSemestrePicker = () => {
    Keyboard.dismiss();
    setSemestrePickerVisible(true);
  };

  const closeSemestrePicker = () => {
    setSemestrePickerVisible(false);
  };

  const selectSemestre = (semestre: string) => {
    if (semestre === 'Electiva') {
      setFormData({ ...formData, semestre: '10' });
    } else {
      setFormData({ ...formData, semestre: semestre.toString() });
    }
    closeSemestrePicker();
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

  // Normaliza una opción del array a su valor interno (string)
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

  // Valor seleccionado actual normalizado (string)
  const selectedValue = formData?.semestre ? String(formData.semestre) : '';

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 24}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Nueva Materia
          </Text>

          <TextInput
            label="Nombre de la materia *"
            value={formData.nombre}
            onChangeText={(text) => setFormData({ ...formData, nombre: text })}
            error={!!errors.nombre}
            style={styles.input}
            maxLength={30}
            mode="outlined"
          />
          {errors.nombre ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.nombre}</Text> : null}

          <TextInput
            label="Descripción breve *"
            value={formData.descripcion}
            onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
            error={!!errors.descripcion}
            style={styles.input}
            multiline
            numberOfLines={3}
            mode="outlined"
          />
          {errors.descripcion ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.descripcion}</Text> : null}

          <View style={styles.semestreContainer}>
            <Text variant="labelLarge" style={styles.semestreLabel}>
              Semestre *
            </Text>

            <View style={styles.menuAnchor}>
              <Button
                mode="outlined"
                onPress={openSemestrePicker}
                style={styles.semestreButton}
                icon="chevron-down"
                contentStyle={styles.semestreButtonContent}
              >
                {formData.semestre ? getSemestreText(formData.semestre) : 'Seleccionar semestre'}
              </Button>
            </View>
          </View>
          {errors.semestre ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.semestre}</Text> : null}

          <ImageUploader
            currentImageUrl={formData.imagenUrl}
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
            uploading={uploadingImage}
          />

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
      </KeyboardAvoidingView>
      <Portal>
        <Dialog visible={semestrePickerVisible} onDismiss={closeSemestrePicker}>
          <Dialog.Title>Seleccionar semestre</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(value) => {
                  const matched = semestres.find(
                    (semestre) => optionValue(semestre) === value
                  );
                  if (matched !== undefined) {
                    selectSemestre(String(matched));
                  } else {
                    closeSemestrePicker();
                  }
                }}
                value={selectedValue || ''}
              >
                {semestres.map((semestre) => (
                  <RadioButton.Item
                    key={optionValue(semestre)}
                    label={
                      semestre === 'Electiva'
                        ? 'Electiva'
                        : `Semestre ${semestre}`
                    }
                    value={optionValue(semestre)}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </Modal>
  );
};

const styles = {
  modal: { maxHeight: '90%', margin: 20, borderRadius: 8 },
  keyboardAvoidContainer: { flexGrow: 1, width: '100%' },
  scrollContent: { padding: 24 },
  modalTitle: { marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  input: { marginBottom: 4 },
  errorText: { fontSize: 12, marginBottom: 12, marginLeft: 4, fontWeight: '500' },
  semestreContainer: { marginBottom: 16 },
  semestreLabel: { marginBottom: 8 },
  semestreButton: { width: '100%' },
  semestreButtonContent: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  menuAnchor: { width: '100%' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  button: { minWidth: 100 },
} as const;

export default CreateSubjectModal;
