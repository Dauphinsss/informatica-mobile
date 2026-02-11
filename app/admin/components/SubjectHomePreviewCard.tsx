import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { ActivityIndicator, Card, Text } from "react-native-paper";

interface SubjectHomePreviewCardProps {
  nombre?: string;
  semestre?: number | string;
  imagenUrl?: string;
  loading?: boolean;
  badgeText?: string;
  badgeIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const SUBJECT_COLORS = [
  { bg: "#1976d2", accent: "#0d47a1" },
  { bg: "#388e3c", accent: "#1b5e20" },
  { bg: "#f57c00", accent: "#ef6c00" },
  { bg: "#7b1fa2", accent: "#4a148c" },
  { bg: "#d32f2f", accent: "#b71c1c" },
  { bg: "#303f9f", accent: "#1a237e" },
  { bg: "#0097a7", accent: "#006064" },
  { bg: "#689f38", accent: "#33691e" },
];

const ASPECT_RATIO_21_9 = 21 / 9;

const formatSemestre = (sem: number | string | undefined) => {
  if (sem === undefined || sem === null || sem === "") {
    return "Semestre por definir";
  }

  if (typeof sem === "string" && sem.trim().toLowerCase() === "electiva") {
    return "Electiva";
  }

  const n = Number(sem);
  if (n === 10) return "Electiva";
  if (Number.isNaN(n)) return String(sem);

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
  };

  return labels[n] || `${n}º Semestre`;
};

const SubjectHomePreviewCard: React.FC<SubjectHomePreviewCardProps> = ({
  nombre,
  semestre,
  imagenUrl,
  loading = false,
  badgeText = "Sin materiales",
  badgeIcon = "bookmark-outline",
}) => {
  const colorScheme = SUBJECT_COLORS[0];
  const hasImage = !!imagenUrl;
  const subjectName = (nombre || "").trim() || "Nombre de la materia";

  return (
    <Card style={styles.classroomCard} elevation={2}>
      <View style={styles.cardHeader}>
        {hasImage ? (
          <>
            <Image source={{ uri: imagenUrl }} style={styles.cardHeaderImage} />
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
            <View style={styles.cardHeaderOverlayTint} />
            <View
              style={[
                styles.cardAccentCircle,
                { backgroundColor: colorScheme.accent },
              ]}
            />
            <View
              style={[
                styles.cardAccentStripe,
                { backgroundColor: colorScheme.accent },
              ]}
            />
          </>
        )}

        <View style={styles.cardHeaderContent}>
          <View style={styles.cardBadgeRow}>
            <View style={styles.cardBadge}>
              <MaterialCommunityIcons
                name={badgeIcon}
                size={14}
                color="#fff"
                style={styles.cardBadgeIcon}
              />
              <Text style={styles.cardBadgeText}>{badgeText}</Text>
            </View>
          </View>

          <View style={styles.cardTitleBlock}>
            <Text numberOfLines={2} style={styles.cardTitle}>
              {subjectName}
            </Text>
            <Text style={styles.cardMetaInline}>{formatSemestre(semestre)}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>Guardando...</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  classroomCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardHeader: {
    position: "relative",
    overflow: "hidden",
    aspectRatio: ASPECT_RATIO_21_9,
  },
  cardHeaderColor: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeaderImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  cardHeaderImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cardHeaderOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cardAccentCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
    top: -40,
    right: -40,
    transform: [{ scale: 1.1 }],
  },
  cardAccentStripe: {
    position: "absolute",
    width: 220,
    height: 40,
    opacity: 0.25,
    bottom: -20,
    left: -40,
    transform: [{ rotate: "-25deg" }],
    borderRadius: 20,
  },
  cardHeaderContent: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    bottom: 14,
    justifyContent: "space-between",
    gap: 8,
  },
  cardBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  cardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
  },
  cardBadgeIcon: {
    marginRight: 2,
  },
  cardBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  cardTitleBlock: {
    gap: 12,
  },
  cardTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardMetaInline: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default SubjectHomePreviewCard;
