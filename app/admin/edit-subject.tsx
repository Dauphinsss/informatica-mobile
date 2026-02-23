import { SortOption, SortableChips, SortOrder } from "@/app/components/filters/SortableChips";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { doc, getDoc, getDocs, updateDoc, collection, query, orderBy } from "firebase/firestore";
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
  Checkbox,
  Dialog,
  IconButton,
  Portal,
  RadioButton,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import ImageUploader from "./components/ImageUploader";
import SubjectHomePreviewCard from "./components/SubjectHomePreviewCard";
import { db, storage } from "../../firebase";
import { AdminStackParamList, SemestreOption } from "./_types";
import { normalizeText, SUBJECT_NAME_MAX_LENGTH } from "./_utils/subjectValidations";

type EditSubjectNavigationProp = StackNavigationProp<
  AdminStackParamList,
  "EditSubject"
>;

type EditSubjectRouteProp = RouteProp<AdminStackParamList, "EditSubject">;

const semestres: SemestreOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, "Electiva"];

type Teacher = {
  id: string;
  nombres: string;
  apellidos: string;
};

type Section = {
  id: string;
  nombre: string;
};

type EditTab = "general" | "docentes" | "secciones";
type TeachersSortBy = "nombres" | "apellidos";

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
  const [loadingRelations, setLoadingRelations] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [semestrePickerVisible, setSemestrePickerVisible] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<EditTab>("general");
  const [teachersSortBy, setTeachersSortBy] = useState<TeachersSortBy>("apellidos");
  const [teachersSortOrder, setTeachersSortOrder] = useState<SortOrder>("asc");

  React.useEffect(() => {
    const loadRelations = async () => {
      setLoadingRelations(true);
      try {
        const [teachersSnap, sectionsSnap, subjectSnap] = await Promise.all([
          getDocs(query(collection(db, "docentes"), orderBy("apellidos", "asc"))),
          getDocs(query(collection(db, "secciones"), orderBy("nombre", "asc"))),
          getDoc(doc(db, "materias", subject.id)),
        ]);

        const teacherList: Teacher[] = teachersSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            nombres: data.nombres || "",
            apellidos: data.apellidos || "",
          };
        });
        const sectionList: Section[] = sectionsSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            nombre: data.nombre || "",
          };
        });

        setTeachers(teacherList);
        setSections(sectionList);

        const currentSubject = subjectSnap.data() as any;
        const docentesFromDb = Array.isArray(currentSubject?.docentesIds)
          ? currentSubject.docentesIds
          : Array.isArray(currentSubject?.docentes)
            ? currentSubject.docentes
            : [];
        const seccionesFromDb = Array.isArray(currentSubject?.seccionesIds)
          ? currentSubject.seccionesIds
          : Array.isArray(currentSubject?.secciones)
            ? currentSubject.secciones
            : [];

        setSelectedTeacherIds(docentesFromDb.filter((id: unknown) => typeof id === "string"));
        setSelectedSectionIds(seccionesFromDb.filter((id: unknown) => typeof id === "string"));
      } catch (error) {
        console.error("Error cargando docentes/secciones:", error);
      } finally {
        setLoadingRelations(false);
      }
    };

    loadRelations();
  }, [subject.id]);

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSectionIds((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    setSelectedSectionIds((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const teachersSortOptions: SortOption<TeachersSortBy>[] = [
    { key: "apellidos", label: "Apellidos" },
    { key: "nombres", label: "Nombres" },
  ];

  const sortedTeachers = React.useMemo(() => {
    return [...teachers].sort((a, b) => {
      const aValue = teachersSortBy === "apellidos" ? a.apellidos : a.nombres;
      const bValue = teachersSortBy === "apellidos" ? b.apellidos : b.nombres;
      const result = aValue.trim().toLowerCase().localeCompare(bValue.trim().toLowerCase());
      return teachersSortOrder === "asc" ? result : -result;
    });
  }, [teachers, teachersSortBy, teachersSortOrder]);

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
    } else if (formData.nombre.length > SUBJECT_NAME_MAX_LENGTH) {
      errors.nombre = `El nombre no puede tener más de ${SUBJECT_NAME_MAX_LENGTH} caracteres`;
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
        docentesIds: selectedTeacherIds,
        seccionesIds: selectedSectionIds,
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
        <Appbar.Action
          icon="content-save-outline"
          onPress={handleSave}
          disabled={isSaveDisabled}
        />
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
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EditTab)}
            buttons={[
              { value: "general", label: "General" },
              { value: "docentes", label: "Docentes" },
              { value: "secciones", label: "Secciones" },
            ]}
            style={styles.tabs}
          />

          {activeTab === "general" && (
            <>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Nombre de la materia *"
                  value={formData.nombre}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre: text })
                  }
                  error={!!errors.nombre}
                  style={styles.input}
                  maxLength={SUBJECT_NAME_MAX_LENGTH}
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
                hideImagePreview
              />

              <View style={styles.previewSection}>
                <SubjectHomePreviewCard
                  nombre={formData.nombre}
                  semestre={formData.semestre}
                  imagenUrl={formData.imagenUrl}
                  loading={isSaving}
                />
              </View>
            </>
          )}

          {activeTab === "docentes" && (
            <View style={styles.selectorSection}>
              <Text variant="labelLarge" style={styles.selectorLabel}>
                Docentes de la materia
              </Text>
              <Text style={[styles.selectorHint, { color: theme.colors.onSurfaceVariant }]}>
                Selecciona todos los docentes que dictan esta materia
              </Text>
              <SortableChips
                sortBy={teachersSortBy}
                sortOrder={teachersSortOrder}
                onFilterChange={(sortBy, sortOrder) => {
                  setTeachersSortBy(sortBy);
                  setTeachersSortOrder(sortOrder);
                }}
                options={teachersSortOptions}
                theme={theme}
              />
              {loadingRelations ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Cargando docentes...
                </Text>
              ) : (
                sortedTeachers.map((teacher) => {
                  const checked = selectedTeacherIds.includes(teacher.id);
                  const teacherLabel =
                    teachersSortBy === "apellidos"
                      ? `${teacher.apellidos} ${teacher.nombres}`.trim()
                      : `${teacher.nombres} ${teacher.apellidos}`.trim();
                  return (
                    <View key={teacher.id} style={styles.checkboxRow}>
                      <Checkbox
                        status={checked ? "checked" : "unchecked"}
                        onPress={() => toggleTeacher(teacher.id)}
                      />
                      <Text onPress={() => toggleTeacher(teacher.id)} style={styles.checkboxLabel}>
                        {teacherLabel}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "secciones" && (
            <>
              <View style={styles.selectorSection}>
                <Text variant="labelLarge" style={styles.selectorLabel}>
                  Secciones de la materia
                </Text>
                <Text style={[styles.selectorHint, { color: theme.colors.onSurfaceVariant }]}>
                  Selecciona secciones y define su orden
                </Text>
                {loadingRelations ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Cargando secciones...
                  </Text>
                ) : (
                  sections.map((section) => {
                    const checked = selectedSectionIds.includes(section.id);
                    return (
                      <View key={section.id} style={styles.checkboxRow}>
                        <Checkbox
                          status={checked ? "checked" : "unchecked"}
                          onPress={() => toggleSection(section.id)}
                        />
                        <Text onPress={() => toggleSection(section.id)} style={styles.checkboxLabel}>
                          {section.nombre}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>

              {selectedSectionIds.length > 0 && (
                <View style={styles.selectorSection}>
                  <Text variant="labelLarge" style={styles.selectorLabel}>
                    Orden de secciones
                  </Text>
                  {selectedSectionIds.map((sectionId, index) => {
                    const current = sections.find((s) => s.id === sectionId);
                    if (!current) return null;
                    return (
                      <View
                        key={`${sectionId}-${index}`}
                        style={[
                          styles.orderRow,
                          {
                            borderColor: theme.colors.outlineVariant,
                            backgroundColor: theme.colors.elevation.level1,
                          },
                        ]}
                      >
                        <View style={[styles.orderBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                          <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: "700" }}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.orderLabel}>{current.nombre}</Text>
                        <View style={styles.orderActions}>
                          <IconButton
                            icon="arrow-up"
                            size={18}
                            disabled={index === 0}
                            onPress={() => moveSection(index, "up")}
                          />
                          <IconButton
                            icon="arrow-down"
                            size={18}
                            disabled={index === selectedSectionIds.length - 1}
                            onPress={() => moveSection(index, "down")}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

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
  tabs: {
    marginBottom: 16,
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
  previewSection: {
    marginTop: 8,
    gap: 10,
  },
  previewLabel: {
    fontWeight: "600",
  },
  selectorSection: {
    marginTop: 18,
    gap: 6,
  },
  selectorLabel: {
    fontWeight: "600",
  },
  selectorHint: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  checkboxLabel: {
    flex: 1,
  },
  orderRow: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderLabel: {
    flex: 1,
  },
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
} as const;
