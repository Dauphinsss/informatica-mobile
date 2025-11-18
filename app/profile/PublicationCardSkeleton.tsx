// src/components/PublicationCardSkeleton.tsx
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Card } from "react-native-paper";

export default function PublicationCardSkeleton() {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Card style={{ backgroundColor: 'transparent', shadowColor: 'transparent' }}>
        <Card.Content>
          {/* Header con avatar y fecha */}
          <View style={styles.cardContent}>
            <Animated.View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.fecha,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            
            {/* Título y descripción */}
            <View style={styles.autorContainer}>
              <Animated.View
                style={[
                  styles.titulo,
                  { backgroundColor: theme.colors.surfaceVariant, opacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.descripcion,
                  { backgroundColor: theme.colors.surfaceVariant, opacity },
                ]}
              />
            </View>
          </View>

          {/* Materia */}
          <Animated.View
            style={[
              styles.materiaNombre,
              { backgroundColor: theme.colors.surfaceVariant, opacity },
            ]}
          />

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Animated.View
              style={[
                styles.statChip,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.statChip,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.statChip,
                { backgroundColor: theme.colors.surfaceVariant, opacity },
              ]}
            />
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fecha: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  autorContainer: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  titulo: {
    width: "90%",
    height: 20,
    borderRadius: 4,
  },
  descripcion: {
    width: "70%",
    height: 16,
    borderRadius: 4,
  },
  materiaNombre: {
    width: "60%",
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    width: 60,
    height: 28,
    borderRadius: 14,
  },
});