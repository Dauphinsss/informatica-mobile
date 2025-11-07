import React, { useState } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { ActivityIndicator, Text, IconButton } from "react-native-paper";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ImageViewerWithZoomProps {
  url: string;
}

export default function ImageViewerWithZoom({ url }: ImageViewerWithZoomProps) {
  const { theme } = useTheme();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // Valores compartidos para animaciones
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  // Gesto de pinch (pellizcar para zoom)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Limitar el zoom entre 1x y 4x
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Gesto de pan (arrastrar cuando hay zoom)
  const panGesture = Gesture.Pan()
    .enabled(scale.value > 1)
    .onUpdate((event) => {
      const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      translateX.value = Math.max(
        -maxTranslateX,
        Math.min(maxTranslateX, savedTranslateX.value + event.translationX)
      );
      translateY.value = Math.max(
        -maxTranslateY,
        Math.min(maxTranslateY, savedTranslateY.value + event.translationY)
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Gesto de doble tap (zoom rápido)
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        // Hacer zoom out
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Hacer zoom in al punto tocado
        const zoomLevel = 2.5;
        scale.value = withTiming(zoomLevel);
        savedScale.value = zoomLevel;

        // Calcular la posición para centrar en el punto tocado
        const centerX = SCREEN_WIDTH / 2;
        const centerY = SCREEN_HEIGHT / 2;
        const offsetX = (event.x - centerX) * (zoomLevel - 1);
        const offsetY = (event.y - centerY) * (zoomLevel - 1);

        translateX.value = withTiming(-offsetX);
        translateY.value = withTiming(-offsetY);
        savedTranslateX.value = -offsetX;
        savedTranslateY.value = -offsetY;
      }
    });

  // Combinar todos los gestos
  const composedGestures = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  // Estilo animado para la imagen
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Función para resetear zoom
  const resetZoom = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <IconButton icon="alert-circle" size={48} iconColor={theme.colors.error} />
        <Text variant="bodyLarge" style={[styles.errorText, { color: theme.colors.onBackground }]}>
          No se pudo cargar la imagen
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {cargando && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onBackground }]}>
            Cargando imagen...
          </Text>
        </View>
      )}

      <GestureDetector gesture={composedGestures}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image
            source={{ uri: url }}
            style={styles.image}
            resizeMode="contain"
            onLoadStart={() => setCargando(true)}
            onLoadEnd={() => setCargando(false)}
            onError={() => {
              setCargando(false);
              setError(true);
            }}
          />
        </Animated.View>
      </GestureDetector>

      {/* Botón para resetear zoom (aparece solo cuando hay zoom) */}
      {scale.value > 1.1 && (
        <View style={styles.resetButton}>
          <IconButton
            icon="magnify-minus"
            size={24}
            iconColor={theme.colors.onPrimary}
            style={{ backgroundColor: theme.colors.primary }}
            onPress={resetZoom}
          />
        </View>
      )}

      {/* Indicador de zoom */}
      {scale.value > 1.1 && (
        <View style={[styles.zoomIndicator, { backgroundColor: theme.colors.surface }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
            {scale.value.toFixed(1)}x
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    textAlign: "center",
  },
  resetButton: {
    position: "absolute",
    bottom: 120,
    right: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  zoomIndicator: {
    position: "absolute",
    bottom: 120,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 4,
  },
});