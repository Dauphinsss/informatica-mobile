import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Chip, IconButton, Text, useTheme } from "react-native-paper";
import { Subject } from "../_types";

// Colores para las tarjetas estilo Classroom
const SUBJECT_COLORS = [
  { bg: "#1976d2", accent: "#0d47a1" }, // Azul
  { bg: "#388e3c", accent: "#1b5e20" }, // Verde
  { bg: "#f57c00", accent: "#ef6c00" }, // Naranja
  { bg: "#7b1fa2", accent: "#4a148c" }, // Morado
  { bg: "#d32f2f", accent: "#b71c1c" }, // Rojo
  { bg: "#303f9f", accent: "#1a237e" }, // Azul índigo
  { bg: "#0097a7", accent: "#006064" }, // Cian
  { bg: "#689f38", accent: "#33691e" }, // Verde lima
];

interface SubjectCardProps {
  subject: Subject;
  index: number;
  onToggleStatus: (
    subjectId: string,
    currentStatus: "active" | "inactive"
  ) => void;
  onEdit: (subject: Subject) => void;
  isUpdating?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  index,
  onToggleStatus,
  onEdit,
  isUpdating = false,
}) => {
  const theme = useTheme();
  const colorScheme = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
  const hasImage = !!subject?.imagenUrl;

  const handlePress = () => {
    onEdit(subject);
  };

  const handleToggleStatus = (e: any) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggleStatus(subject.id, subject.estado);
    }
  };

  const getSemestreText = (semestre: any) => {
    if (
      semestre === 10 ||
      semestre === "10" ||
      String(semestre).toLowerCase() === "electiva"
    ) {
      return "Electiva";
    }
    const n = Number(semestre);
    if (!Number.isNaN(n) && n > 0) {
      return `${n}º Semestre`;
    }
    return String(semestre || "");
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.classroomCard} elevation={2}>
        {/* Header con color o imagen */}
        <View style={styles.cardHeader}>
          {hasImage ? (
            <>
              <Image
                source={{ uri: subject.imagenUrl }}
                style={styles.cardHeaderImage}
              />
              <View style={styles.cardHeaderImageOverlay} />
            </>
          ) : (
            <>
              <View
                style={[
                  styles.cardHeaderColor,
                  { backgroundColor: colorScheme.bg },
                ]}
              />
              <View
                style={[
                  styles.cardHeaderAccent,
                  { backgroundColor: colorScheme.accent },
                ]}
              />
            </>
          )}

          {/* Badge de estado en la esquina */}
          <TouchableOpacity
            onPress={handleToggleStatus}
            disabled={isUpdating}
            style={styles.statusBadgeContainer}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: isUpdating ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.4)",
                  opacity: isUpdating ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {subject.estado === "active" ? "Activa" : "Inactiva"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contenido del card */}
        <Card.Content style={styles.cardBody}>
          <Text variant="titleMedium" style={styles.subjectTitle} numberOfLines={2}>
            {subject.nombre}
          </Text>

          <Text variant="bodySmall" style={styles.semestreText}>
            {getSemestreText(subject.semestre)}
          </Text>

          <Text
            variant="bodySmall"
            style={styles.descriptionText}
            numberOfLines={2}
          >
            {subject.descripcion}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  classroomCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    height: 100,
    position: "relative",
    overflow: "hidden",
  },
  cardHeaderColor: {
    width: "100%",
    height: "100%",
  },
  cardHeaderAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
  },
  cardHeaderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardHeaderImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  statusBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  statusChip: {
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
    textAlignVertical: "center",
    color: "#FFFFFF",
  },
  cardBody: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  subjectTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  semestreText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  descriptionText: {
    opacity: 0.8,
    lineHeight: 18,
  },
});

export default SubjectCard;
