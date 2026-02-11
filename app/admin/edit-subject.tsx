import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { doc, getDocs, updateDoc, collection } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import ImageUploader from "./components/ImageUploader";
import SubjectHomePreviewCard from "./components/SubjectHomePreviewCard";
import { db, storage } from "../../firebase";
import { AdminStackParamList, SemestreOption } from "./_types";
import { normalizeText } from "./_utils/subjectValidations";

type EditSubjectNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "EditSubject"
>;

type EditSubjectRouteProp = RouteProp<AdminStackParamList, "EditSubject">;

const semestres: SemestreOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, "Electiva"];

export default function EditSubjectScreen() {
  const navigation = useNavigation<EditSubjectNavigationProp>();
  const route = useRoute<EditSubjectRouteProp>();
  const theme = useTheme();
  const scrollViewRef = React.useRef<ScrollView>(null);

  const { subject } = route.params;

  const [formData, setFormData] = useState({
    nombre: subject.nombre,
    semestre: subject.semestre as SemestreOption,
    imagenUrl: subject.imagenUrl || "",
  });
  const [errors, setErrors] = useState({
    nombre: "",
    semestre: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [semestrePickerVisible, setSemestrePickerVisible] = useState(false);

  const checkDuplicateSubject = async (
    nombre: string,
    excludeId: string
  ): Promise<boolean> => {
    try {
      const subjectsCollection = collection(db, "materias");
      const querySnapshot = await getDocs(subjectsCollection);

      const normalizedNewNombre = normalizeText(nombre);

      const exists = querySnapshot.docs.some((doc) => {
        if (doc.id === excludeId) return false;
        const subjectData = doc.data();
        const existingNombre = subjectData.nombre || "";
        return normalizeText(existingNombre) === normalizedNewNombre;
      });

      return exists;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  };

  const uploadLocalImageAndGetUrl = async (localUri: string) => {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `materias/${timestamp}-${randomStr}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      throw err;
    }
  };

  const validateEditFields = (formData: {
    nombre: string;
    semestre: SemestreOption;
  }) => {
    const errors = {
      nombre: "",
      semestre: "",
    };

    const nombreRegex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ,.;:()\-]+$/;
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (formData.nombre.length > 30) {
      errors.nombre = "El nombre no puede tener más de 30 caracteres";
    } else if (!nombreRegex.test(formData.nombre)) {
      errors.nombre = "El nombre contiene caracteres no válidos";
    }

    const isValid = !Object.values(errors).some((error) => error !== "");
    return { isValid, errors };
  };

  const handleSave = async () => {
    const { isValid, errors: validationErrors } =
      validateEditFields(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const nombreNormalizado = formData.nombre.trim();

      const exists = await checkDuplicateSubject(
        nombreNormalizado,
        subject.id
      );
      if (exists) {
        setErrors((prev) => ({
          ...prev,
          nombre: "Ya existe una materia con ese nombre",
        }));
        setLoading(false);
        return;
      }

      let imagenUrlToSave = formData.imagenUrl;
      if (imagenUrlToSave && !imagenUrlToSave.startsWith("http")) {
        try {
          setUploadingImage(true);
          imagenUrlToSave = await uploadLocalImageAndGetUrl(imagenUrlToSave);
        } catch (err) {
          console.error("Error subiendo imagen:", err);
          imagenUrlToSave = "";
        } finally {
          setUploadingImage(false);
        }
      }

      const subjectRef = doc(db, "materias", subject.id);
      await updateDoc(subjectRef, {
        nombre: nombreNormalizado,
        descripcion: "",
        semestre: formData.semestre,
        imagenUrl: imagenUrlToSave,
        updatedAt: new Date(),
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error updating subject:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  const openSemestrePicker = () => {
    Keyboard.dismiss();
    setSemestrePickerVisible(true);
  };

  const closeSemestrePicker = () => {
    setSemestrePickerVisible(false);
  };

  const selectSemestre = (semestre: SemestreOption) => {
    setFormData({ ...formData, semestre });
    closeSemestrePicker();
  };

  const handleImageSelected = (localUri: string) => {
    setFormData({ ...formData, imagenUrl: localUri });
  };

  const handleImageRemoved = () => {
    setFormData({ ...formData, imagenUrl: "" });
  };

  const getSemestreText = (semestre: SemestreOption) => {
    return semestre === "Electiva" ? "Electiva" : `Semestre ${semestre}`;
  };

  const optionValue = (opt: SemestreOption) => {
    return String(opt);
  };

  const selectedValue = formData?.semestre ? String(formData.semestre) : "";

  const isSaveDisabled =
    !formData.nombre.trim() ||
    loading ||
    uploadingImage;
  const isSaving = loading || uploadingImage;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Editar Materia" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputContainer}>
            <TextInput
              label="Nombre de la materia *"
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData({ ...formData, nombre: text })
              }
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
                {getSemestreText(formData.semestre)}
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
            uploading={uploadingImage}
          />

          <View style={styles.previewSection}>
            <Text variant="labelLarge" style={styles.previewLabel}>
              Previsualizacion en Home
            </Text>
            <SubjectHomePreviewCard
              nombre={formData.nombre}
              semestre={formData.semestre}
              imagenUrl={formData.imagenUrl}
              loading={isSaving}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.button}
              disabled={loading || uploadingImage}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
              disabled={isSaveDisabled}
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
                    selectSemestre(matched);
                  } else {
                    closeSemestrePicker();
                  }
                }}
                value={selectedValue || ""}
              >
                {semestres.map((semestre) => (
                  <RadioButton.Item
                    key={optionValue(semestre)}
                    label={getSemestreText(semestre)}
                    value={optionValue(semestre)}
                  />
                ))}
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 12,
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  previewSection: {
    marginTop: 8,
    gap: 10,
  },
  previewLabel: {
    fontWeight: "600",
  },
  button: {
    minWidth: 100,
  },
} as const;
