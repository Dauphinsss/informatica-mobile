import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Divider, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Shimmer = ({ style, color }: { style?: any; color?: string }) => (
  <View style={[styles.shimmer, style, color ? { backgroundColor: color } : {}]} />
);

// Skeleton de una tarjeta de actividad usando Card de Paper
const ActivityCardSkeleton = () => {
  const theme = useTheme();
  return (
    <Card mode="elevated" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.cardContent}>
        {/* Ícono Skeleton */}
        <View style={[styles.iconSkeleton, { backgroundColor: theme.colors.surfaceVariant }]} />
        {/* Contenido Skeleton */}
        <View style={styles.textsColumn}>
          <Shimmer style={[styles.titleSkeleton]} color={theme.colors.surfaceVariant} />
          <Shimmer style={[styles.descSkeleton]} color={theme.colors.surfaceVariant} />
          <View style={styles.timeRow}>
            <Shimmer style={[styles.timeSkeleton]} color={theme.colors.surfaceVariant} />
            <Shimmer style={[styles.buttonSkeleton]} color={theme.colors.surfaceVariant} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

export default function ActivityListSkeleton() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShown(true), 300);
    return () => clearTimeout(timeout);
  }, []);

  if (!shown) return null;

  const shimmerColor = theme.colors.surfaceVariant;

  return (
    <ScrollView
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Ejemplo de sección: Hoy */}
      <View style={styles.section}>
        <Shimmer style={[styles.sectionTitle, { width: 82 }]} color={shimmerColor} />
        {[...Array(3)].map((_, i) => (
          <React.Fragment key={i}>
            <ActivityCardSkeleton />
            {i < 2 && <Divider style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
      <View style={{ height: 24 }} />
      {/* Ejemplo de sección: Ayer */}
      <View style={styles.section}>
        <Shimmer style={[styles.sectionTitle, { width: 62 }]} color={shimmerColor} />
        {[...Array(2)].map((_, i) => (
          <React.Fragment key={i}>
            <ActivityCardSkeleton />
            {i < 1 && <Divider style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

// ---- ESTILOS USANDO PATRONES DE PAPERNATIVE ----
const styles = StyleSheet.create({
  shimmer: {
    borderRadius: 6,
    minHeight: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    height: 18,
    width: 82,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  card: {
    borderRadius: 12,
    marginBottom: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  textsColumn: {
    flex: 1,
    gap: 10,
    paddingVertical: 2,
  },
  titleSkeleton: {
    height: 16,
    width: "65%",
    borderRadius: 5,
    marginBottom: 6,
  },
  descSkeleton: {
    height: 12,
    width: "90%",
    borderRadius: 4,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 4,
  },
  timeSkeleton: {
    height: 11,
    width: 54,
    borderRadius: 3,
  },
  buttonSkeleton: {
    height: 28,
    width: 28,
    borderRadius: 14,
  },
  divider: {
    marginVertical: 0,
  },
});