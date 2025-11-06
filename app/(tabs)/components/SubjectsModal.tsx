import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
  Checkbox,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  ActivityIndicator,
} from "react-native-paper";
import SubjectsModalSkeleton from "./SubjectsModalSkeleton";

interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  semestre: number;
  estado: "active" | "inactive";
}

interface SubjectsModalProps {
  visible: boolean;
  onDismiss: () => void;
  enrolledSubjectIds: string[];
  userId: string;
  onEnrollmentChange?: () => void;
}

export default function SubjectsModal({
  visible,
  onDismiss,
  enrolledSubjectIds,
  userId,
  onEnrollmentChange,
}: SubjectsModalProps) {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [savingSubject, setSavingSubject] = useState<string | null>(null);
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
    new Set()
  );

  const formatSemestre = (sem: any) => {
    if (typeof sem === "string" && sem.trim().toLowerCase() === "electiva") {
      return "Electiva";
    }

    const n = Number(sem);
    if (Number.isNaN(n)) {
      return String(sem || "");
    }

    const labels: Record<number, string> = {
      1: "1er Semestre",
      2: "2do Semestre",
      3: "3er Semestre",
      4: "4to Semestre",
      5: "5to Semestre",
      6: "6to Semestre",
      7: "7mo Semestre",
      8: "8vo Semestre",
      9: "9no Semestre",
      10: "Electiva",
    };

    return labels[n] || `${n}º Semestre`;
  };

  const groupedSubjects = useMemo(() => {
    const groups = new Map<string, { order: number; subjects: Subject[] }>();

    subjects.forEach((subject) => {
      const label = formatSemestre(subject.semestre);
      const rawOrder = Number(subject.semestre);
      const order = Number.isNaN(rawOrder) ? 99 : rawOrder;

      if (!groups.has(label)) {
        groups.set(label, { order, subjects: [] });
      }
      groups.get(label)!.subjects.push(subject);
    });

    return Array.from(groups.entries())
      .map(([label, { order, subjects: items }]) => ({
        label,
        order,
        subjects: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.label.localeCompare(b.label);
      });
  }, [subjects]);

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      setExpandedAccordions(
        new Set([groupedSubjects[0]?.label].filter(Boolean))
      );
    }
  }, [visible]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "materias");
      const subjectSnapshot = await getDocs(subjectsCollection);
      const subjectsList = subjectSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subject[];

      subjectsList.sort((a, b) => {
        if (a.semestre !== b.semestre) {
          return a.semestre - b.semestre;
        }
        return a.nombre.localeCompare(b.nombre);
      });

      const activeSubjects = subjectsList.filter((s) => s.estado === "active");
      setSubjects(activeSubjects);
    } catch {
      // Error silencioso
    } finally {
      setLoadingSubjects(false);
    }
  };

  const toggleSubjectEnrollment = async (subjectId: string) => {
    setSavingSubject(subjectId);
    const userRef = doc(db, "usuarios", userId);
    const isEnrolled = enrolledSubjectIds.includes(subjectId);

    try {
      if (isEnrolled) {
        await updateDoc(userRef, {
          materiasInscritas: arrayRemove(subjectId),
        });
      } else {
        await updateDoc(userRef, {
          materiasInscritas: arrayUnion(subjectId),
        });
      }
      onEnrollmentChange?.();
    } catch {
      if (!isEnrolled) {
        try {
          await updateDoc(userRef, {
            materiasInscritas: [subjectId],
          });
          onEnrollmentChange?.();
        } catch {
          Alert.alert(
            "Error",
            "No se pudo guardar la materia. Verifica tu conexión."
          );
        }
      }
    } finally {
      setSavingSubject(null);
    }
  };

  const toggleAccordion = (label: string) => {
    setExpandedAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.modalHeader}>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onSurface }}
          >
            Todas las Materias
          </Text>
          <IconButton icon="close" size={24} onPress={onDismiss} />
        </View>
        <Divider />

        <ScrollView style={styles.modalContent}>
          {loadingSubjects ? (
            <SubjectsModalSkeleton />
          ) : subjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface, textAlign: "center" }}
              >
                No hay materias disponibles
              </Text>
            </View>
          ) : (
            <List.Section style={styles.listSectionNoMargin}>
              {groupedSubjects.map(
                ({ label, subjects: groupSubjects }, groupIndex) => (
                  <List.Accordion
                    key={label}
                    title={`${label} • ${groupSubjects.length}`}
                    titleStyle={{
                      color: theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                    left={(props) => (
                      <List.Icon {...props} icon="school-outline" />
                    )}
                    style={styles.accordion}
                    expanded={expandedAccordions.has(label)}
                    onPress={() => toggleAccordion(label)}
                  >
                    {groupSubjects.map((subject, subjectIndex) => {
                      const isEnrolled = enrolledSubjectIds.includes(
                        subject.id
                      );
                      const isSaving = savingSubject === subject.id;
                      return (
                        <View key={subject.id}>
                          <List.Item
                            style={styles.listItemNoMargin}
                            title={subject.nombre}
                            titleStyle={{ color: theme.colors.onSurface }}
                            onPress={() =>
                              !isSaving && toggleSubjectEnrollment(subject.id)
                            }
                            disabled={isSaving}
                            right={() =>
                              isSaving ? (
                                <ActivityIndicator
                                  size="small"
                                  style={{ marginRight: 12 }}
                                />
                              ) : (
                                <Checkbox
                                  status={isEnrolled ? "checked" : "unchecked"}
                                  onPress={() =>
                                    toggleSubjectEnrollment(subject.id)
                                  }
                                />
                              )
                            }
                          />
                          {subjectIndex < groupSubjects.length - 1 && (
                            <Divider style={styles.dividerNoMargin} />
                          )}
                        </View>
                      );
                    })}
                  </List.Accordion>
                )
              )}
            </List.Section>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingRight: 8,
  },
  modalContent: {
    maxHeight: 500,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
  },
  listSectionNoMargin: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  listItemNoMargin: {
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },
  dividerNoMargin: {
    marginHorizontal: 0,
  },
  accordion: {
    backgroundColor: "transparent",
  },
});
