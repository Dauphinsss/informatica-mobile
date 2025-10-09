import React from 'react';
import { View } from 'react-native';
import { Button, Modal, Text, TextInput } from 'react-native-paper';

interface CreateSubjectModalProps {
  visible: boolean;
  onDismiss: () => void;
  formData: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  setFormData: (data: any) => void;
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
  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modal}
    >
      <Text variant="headlineSmall" style={styles.modalTitle}>
        Nueva Materia
      </Text>
      
      <TextInput
        label="Nombre de la materia *"
        value={formData.nombre}
        onChangeText={(text) => {
          const filteredText = text.replace(/[^a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ,.;:()\-]/g, '');
          setFormData({ ...formData, nombre: filteredText });
        }}
        error={!!errors.nombre}
        style={styles.input}
        maxLength={30}
        mode="outlined"
        outlineColor="#E0E0E0"
        activeOutlineColor="#000"
      />
      {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}
      
      <TextInput
        label="Descripción breve *"
        value={formData.descripcion}
        onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
        error={!!errors.descripcion}
        style={styles.input}
        multiline
        numberOfLines={3}
        mode="outlined"
        outlineColor="#E0E0E0"
        activeOutlineColor="#000"
      />
      {errors.descripcion ? <Text style={styles.errorText}>{errors.descripcion}</Text> : null}
      
      <TextInput
        label="Semestre *"
        value={formData.semestre}
        onChangeText={(text) => {
          const numbersOnly = text.replace(/[^0-9]/g, '').slice(0, 2);
          setFormData({ ...formData, semestre: numbersOnly });
        }}
        error={!!errors.semestre}
        style={styles.input}
        keyboardType="numeric"
        maxLength={2}
        mode="outlined"
        outlineColor="#E0E0E0"
        activeOutlineColor="#000"
      />
      {errors.semestre ? <Text style={styles.errorText}>{errors.semestre}</Text> : null}

      <View style={styles.modalButtons}>
        <Button
          mode="outlined"
          onPress={onDismiss}
          style={styles.button}
          disabled={loading}
          textColor="#000"
        >
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          style={styles.button}
          disabled={isSaveDisabled}
          loading={loading}
          buttonColor="#000" // ✅ AGREGAR ESTA LÍNEA

        >
          Guardar
        </Button>
      </View>
    </Modal>
  );
};

const styles = {
  modal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#e74c3c',
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
    borderRadius: 8,
  },
} as const;

export default CreateSubjectModal;