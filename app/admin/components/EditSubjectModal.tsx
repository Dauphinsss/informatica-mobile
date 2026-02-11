
import React from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
  Button,
  Dialog,
  Modal,
  Portal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SemestreOption, Subject } from "../_types";
import ImageUploader from "./ImageUploader";

interface EditSubjectModalProps {
  visible: boolean;
  onDismiss: () => void;
  subject: Subject | null;
  formData: {
    nombre: string;
    descripcion: string;
    semestre: SemestreOption;
    imagenUrl?: string;
  };
  setFormData: (data: {
    nombre: string;
    descripcion: string;
    semestre: SemestreOption;
    imagenUrl?: string;
  }) => void;
  errors: {
    nombre: string;
    descripcion: string;
    semestre: string;
  };
  loading: boolean;
  onSave: () => void;
  isSaveDisabled: boolean;
}

const semestres: SemestreOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, "Electiva"];

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  visible,
  onDismiss,
  subject,
  formData,
  setFormData,
  errors,
  loading,
  onSave,
  isSaveDisabled,
}) => {
  const theme = useTheme();
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

  const selectSemestre = (semestre: SemestreOption) => {
    if (semestre === "Electiva") {
      setFormData({ ...formData, semestre: 10 as SemestreOption });
    } else {
      setFormData({ ...formData, semestre: semestre });
    }
    closeSemestrePicker();
  };

  const handleImageSelected = (localUri: string) => {
    setFormData({ ...formData, imagenUrl: localUri });
  };

  const handleImageRemoved = () => {
    setFormData({ ...formData, imagenUrl: "" });
  };

  const getSemestreText = (semestre: SemestreOption) => {
    if (
      semestre === 10 ||
      String(semestre) === "10" ||
      String(semestre).toLowerCase() === "electiva"
    ) {
      return "Electiva";
    }
    return typeof semestre === "number"
      ? `Semestre ${semestre}`
      : String(semestre);
  };

  const optionValue = (opt: SemestreOption) => {
    if (opt === "Electiva") return "10";
    return String(opt);
  };

  const selectedValue = optionValue(formData.semestre);

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.modal,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 24}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Editar Materia
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
          {errors.nombre ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.nombre}
            </Text>
          ) : null}

          <TextInput
            label="Descripción breve *"
            value={formData.descripcion}
            onChangeText={(text) =>
              setFormData({ ...formData, descripcion: text })
            }
            error={!!errors.descripcion}
            style={styles.input}
            multiline
            numberOfLines={3}
            mode="outlined"
          />
          {errors.descripcion ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.descripcion}
            </Text>
          ) : null}

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
                {formData.semestre !== undefined && formData.semestre !== null
                  ? getSemestreText(formData.semestre)
                  : "Seleccionar semestre"}
              </Button>
            </View>
          </View>
          {errors.semestre ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.semestre}
            </Text>
          ) : null}

          <ImageUploader
            currentImageUrl={formData.imagenUrl}
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
          />

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
              disabled={isSaveDisabled || loading}
              loading={loading}
            >
              Actualizar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Portal>
        <Dialog
          visible={semestrePickerVisible}
          onDismiss={closeSemestrePicker}
        >
          <Dialog.Title>Seleccionar semestre</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <RadioButton.Group
                onValueChange={(value) => {
                  const matched = semestres.find(
                    (semestre) => optionValue(semestre) === value
                  );
                  if (matched !== undefined) {
                    selectSemestre(matched);
                  } else {
                    closeSemestrePicker();
                  }
                }}
                value={selectedValue || ""}
              >
                {semestres.map((semestre) => (
                  <RadioButton.Item
                    key={String(semestre)}
                    label={
                      semestre === "Electiva"
                        ? "Electiva"
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
  modal: {
    padding: 24,
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  keyboardAvoidContainer: {
    flexGrow: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  semestreContainer: {
    marginBottom: 16,
  },
  semestreLabel: {
    marginBottom: 8,
  },
  semestreButton: {
    width: "100%",
  },
  semestreButtonContent: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  menuAnchor: {
    width: "100%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
} as const;

export default EditSubjectModal;
