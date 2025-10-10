import React from 'react';
import { View } from 'react-native';
import { Button, Modal, Text, TextInput, useTheme } from 'react-native-paper';

interface CreateSubjectModalProps {
  visible: boolean;
  onDismiss: () => void;
  formData: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  setFormData: (data: { nombre: string; descripcion: string; semestre: string }) => void;
  errors: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  loading: boolean;
  onSave: () => void;
  isSaveDisabled: boolean;
}

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

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
    >
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
      
      <TextInput
        label="Semestre *"
        value={formData.semestre}
        onChangeText={(text) => setFormData({ ...formData, semestre: text })}
        error={!!errors.semestre}
        style={styles.input}
        keyboardType="numeric"
        maxLength={2}
        mode="outlined"
      />
      {errors.semestre ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.semestre}</Text> : null}

      <View style={styles.modalButtons}>
        <Button
          mode="outlined"
          onPress={onDismiss}
          style={styles.button}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          style={styles.button}
          disabled={isSaveDisabled}
          loading={loading}
        >
          Guardar
        </Button>
      </View>
    </Modal>
  );
};

const styles = {
  modal: {
    padding: 24,
    margin: 20,
    borderRadius: 8, 
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
} as const;

export default CreateSubjectModal;