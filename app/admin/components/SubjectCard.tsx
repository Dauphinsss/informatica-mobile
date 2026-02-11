import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
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
  const handlePress = () => {
    onEdit(subject);
  };

  const handleToggleStatus = (e: any) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggleStatus(subject.id, subject.estado);
    }
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
        <View style={styles.editHintOverlay}>
          <Text style={styles.editHintText}>Toca para editar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    marginBottom: 14,
    position: "relative",
  },
  statusToggleOverlay: {
    position: "absolute",
    right: 12,
    bottom: 10,
    alignItems: "flex-end",
  },
  editHintOverlay: {
    position: "absolute",
    left: 12,
    top: 10,
    backgroundColor: "rgba(0,0,0,0)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
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
});

export default SubjectCard;
