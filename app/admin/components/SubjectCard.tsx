import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import SubjectHomePreviewCard from "./SubjectHomePreviewCard";
import { Subject } from "../_types";

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

  const handlePress = () => {
    onEdit(subject);
  };

  const handleToggleStatus = (e: any) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggleStatus(subject.id, subject.estado);
    }
  };

  const getSemestreText = (semestre: Subject["semestre"]) => {
    if (semestre === 10 || String(semestre).toLowerCase() === "electiva") {
      return "Electiva";
    }
    const n = Number(semestre);
    if (!Number.isNaN(n) && n > 0) {
      return `${n}º Semestre`;
    }
    return "Semestre por definir";
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.previewContainer}>
        <SubjectHomePreviewCard
          nombre={subject.nombre}
          semestre={subject.semestre}
          imagenUrl={subject.imagenUrl}
          badgeText={subject.estado === "active" ? "Activa" : "Inactiva"}
          badgeIcon={subject.estado === "active" ? "check-circle-outline" : "pause-circle-outline"}
        />
        <TouchableOpacity
          onPress={handleToggleStatus}
          disabled={isUpdating}
          style={styles.statusToggleOverlay}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.statusTogglePill,
              { opacity: isUpdating ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.statusToggleText}>
              {isUpdating ? "Actualizando..." : "Cambiar estado"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Card style={[styles.metaCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Card.Content style={styles.metaContent}>
          <Text variant="bodyMedium" style={styles.metaText} numberOfLines={1}>
            {getSemestreText(subject.semestre)}
          </Text>
          <Text variant="labelSmall" style={styles.tapToEditText}>
            Toca la tarjeta para editar
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    marginBottom: 16,
    position: "relative",
  },
  statusToggleOverlay: {
    position: "absolute",
    right: 12,
    bottom: 10,
    alignItems: "flex-end",
  },
  statusTogglePill: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metaCard: {
    marginTop: -8,
    marginBottom: 16,
    borderRadius: 12,
  },
  metaContent: {
    paddingTop: 14,
    paddingBottom: 12,
  },
  metaText: {
    opacity: 0.7,
    fontWeight: "600",
  },
  tapToEditText: {
    marginTop: 8,
    opacity: 0.7,
    fontWeight: "600",
  },
});

export default SubjectCard;
