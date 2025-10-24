import React from "react";
import { Keyboard, ScrollView, View } from "react-native";
import {
  Button,
  Divider,
  Menu,
  Modal,
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
  const [menuVisible, setMenuVisible] = React.useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Cerrar teclado cuando se abre el modal
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  const selectSemestre = (semestre: SemestreOption) => {
    if (semestre === "Electiva") {
      setFormData({ ...formData, semestre: 10 as SemestreOption });
    } else {
      setFormData({ ...formData, semestre: semestre });
    }
    closeMenu();
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

  // Función para hacer scroll cuando un input se enfoca
  const handleInputFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.modal,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={styles.modalTitle}>
          Editar Materia
        </Text>

        <ImageUploader
          currentImageUrl={formData.imagenUrl}
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
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
          {errors.nombre ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.nombre}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
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
            onFocus={() => handleInputFocus(200)}
            returnKeyType="done"
          />
          {errors.descripcion ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.descripcion}
            </Text>
          ) : null}
        </View>

        <View style={styles.semestreContainer}>
          <Text variant="labelLarge" style={styles.semestreLabel}>
            Semestre *
          </Text>

          <Menu
            key={String(formData.semestre ?? "")}
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <View style={{ width: "100%" }}>
                <Button
                  mode="outlined"
                  onPress={openMenu}
                  style={styles.semestreButton}
                  icon="chevron-down"
                  contentStyle={styles.semestreButtonContent}
                >
                  {formData.semestre !== undefined && formData.semestre !== null
                    ? getSemestreText(formData.semestre)
                    : "Seleccionar semestre"}
                </Button>
              </View>
            }
            style={{ zIndex: 9999 }}
          >
            {semestres
              .filter(
                (sem) => optionValue(sem as SemestreOption) !== selectedValue
              )
              .map((semestre, index) => (
                <React.Fragment key={`${String(semestre)}-${index}`}>
                  <Menu.Item
                    onPress={() => selectSemestre(semestre)}
                    title={
                      semestre === "Electiva"
                        ? "Electiva"
                        : `Semestre ${semestre}`
                    }
                  />
                  {index < semestres.length - 1 && <Divider />}
                </React.Fragment>
              ))}
          </Menu>
        </View>
        {errors.semestre ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {errors.semestre}
          </Text>
        ) : null}

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
    </Modal>
  );
};

const styles = {
  modal: {
    margin: 20,
    borderRadius: 8,
    maxHeight: "85%", // Reducido ligeramente
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40, // Más padding en la parte inferior
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  button: {
    minWidth: 100,
  },
} as const;

export default EditSubjectModal;