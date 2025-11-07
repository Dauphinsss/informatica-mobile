import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { addDoc, collection, getDocs } from "firebase/firestore";
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
import { auth, db, storage } from "../../firebase";
import { AdminStackParamList } from "./_types";
import {
  normalizeText,
  validateSubjectFields,
} from "./_utils/subjectValidations";
import ImageUploader from "./components/ImageUploader";

type CreateSubjectNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "CreateSubject"
>;

const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, "Electiva"];

export default function CreateSubjectScreen() {
  const navigation = useNavigation<CreateSubjectNavigationProp>();
  const theme = useTheme();
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    semestre: "" as string,
    imagenUrl: undefined as string | undefined,
  });
  const [errors, setErrors] = useState({
    nombre: "",
    descripcion: "",
    semestre: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [semestrePickerVisible, setSemestrePickerVisible] = useState(false);

  const checkDuplicateSubject = async (nombre: string): Promise<boolean> => {
    try {
      const subjectsCollection = collection(db, "materias");
      const querySnapshot = await getDocs(subjectsCollection);

      const normalizedNewNombre = normalizeText(nombre);

      const exists = querySnapshot.docs.some((doc) => {
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

  const handleSave = async () => {
    const { isValid, errors: validationErrors } =
      validateSubjectFields(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const nombreNormalizado = formData.nombre.trim();

      const exists = await checkDuplicateSubject(nombreNormalizado);
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
          imagenUrlToSave = undefined;
        } finally {
          setUploadingImage(false);
        }
      }

      const semestreNum =
        typeof formData.semestre === "string"
          ? parseInt(formData.semestre) || 0
          : Number(formData.semestre || 0);

      const newSubject = {
        nombre: nombreNormalizado,
        descripcion: formData.descripcion.trim(),
        semestre: semestreNum,
        estado: "active",
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid,
        imagenUrl: imagenUrlToSave,
      };

      const docRef = await addDoc(collection(db, "materias"), newSubject);

      // Notificación
      try {
        const { notificarCreacionMateria } = await import(
          "@/services/notifications"
        );
        await notificarCreacionMateria(
          docRef.id,
          nombreNormalizado,
          formData.descripcion.trim(),
          semestreNum
        );
      } catch (error) {
        console.error("Error al enviar notificación:", error);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error creating subject:", error);
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

  const selectSemestre = (semestre: string) => {
    if (semestre === "Electiva") {
      setFormData({ ...formData, semestre: "10" });
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
    return semestre === "10" ? "Electiva" : `Semestre ${semestre}`;
  };

  const optionValue = (opt: number | string) => {
    if (opt === "Electiva") return "10";
    return String(opt);
  };

  const selectedValue = formData?.semestre ? String(formData.semestre) : "";

  const isSaveDisabled =
    !formData.nombre.trim() ||
    !formData.descripcion.trim() ||
    !formData.semestre ||
    loading ||
    uploadingImage;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Nueva Materia" />
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
                {formData.semestre
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
            uploading={uploadingImage}
          />

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
                    selectSemestre(String(matched));
                  } else {
                    closeSemestrePicker();
                  }
                }}
                value={selectedValue || ""}
              >
                {semestres.map((semestre) => (
                  <RadioButton.Item
                    key={optionValue(semestre)}
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
  button: {
    minWidth: 100,
  },
} as const;
