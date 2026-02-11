import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, ScrollView, StatusBar, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";
import { ActivityIndicator, IconButton, Text } from "react-native-paper";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Archivo {
  id: string;
  titulo: string;
  webUrl: string;
  tipoNombre?: string;
  tamanoBytes: number;
  esEnlaceExterno?: boolean;
}

interface RouteParams {
  archivos: Archivo[];
  indiceInicial: number;
  materiaNombre: string;
}

const obtenerTipoArchivo = (tipoNombre: string): string => {
  const tipo = tipoNombre?.toLowerCase() || "";
  if (tipo.includes("pdf")) return "pdf";
  if (tipo.includes("imagen") || tipo.includes("image")) return "imagen";
  if (tipo.includes("video")) return "video";
  if (tipo.includes("audio") || tipo.includes("mp3")) return "audio";
  if (tipo.includes("word")) return "word";
  if (tipo.includes("excel")) return "excel";
  if (tipo.includes("presentación") || tipo.includes("powerpoint")) return "powerpoint";
  if (tipo.includes("texto")) return "texto";
  return "otro";
};

export default function FileGalleryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const { archivos: archivosRaw, indiceInicial } = route.params as RouteParams;

  const archivos = archivosRaw.map((a) => ({
    ...a,
    fechaSubida:
      (a as any).fechaSubida && typeof (a as any).fechaSubida === "string"
        ? new Date((a as any).fechaSubida)
        : (a as any).fechaSubida,
  }));

  const archivosVisualizables = archivos.filter((archivo) => {
    const tipo = obtenerTipoArchivo(archivo.tipoNombre || "");
    return tipo !== "otro" && tipo !== "excel";
  });

  const indiceInicialAjustado = archivosVisualizables.findIndex(
    (a) => a.id === archivos[indiceInicial].id
  );

  const [indiceActual, setIndiceActual] = useState(
    indiceInicialAjustado >= 0 ? indiceInicialAjustado : 0
  );
  const [controlsVisible, setControlsVisible] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  const [pagerEnabled, setPagerEnabled] = useState(true);

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("audio")) return "music";
    if (tipo.includes("word")) return "file-word";
    
    if (tipo.includes("powerpoint") || tipo.includes("presentación")) return "file-powerpoint";
    if (tipo.includes("texto")) return "file-document-outline";
    return "file-document";
  };

  const onPageSelected = useCallback(
    (e: any) => {
      setIndiceActual(e.nativeEvent.position);
      const nuevoArchivo = archivosVisualizables[e.nativeEvent.position];
      const nuevoTipo = obtenerTipoArchivo(nuevoArchivo?.tipoNombre || "");
      setPagerEnabled(!["pdf", "word", "excel", "powerpoint", "texto"].includes(nuevoTipo));
    },
    [archivosVisualizables]
  );

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  const archivoActual = archivosVisualizables[indiceActual];

  React.useEffect(() => {
    const tipoActual = obtenerTipoArchivo(archivoActual?.tipoNombre || "");
    setPagerEnabled(!["pdf", "word", "excel", "powerpoint", "texto"].includes(tipoActual));
  }, [indiceActual, archivoActual]);

  if (archivosVisualizables.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <IconButton icon="file-document-alert" size={64} iconColor="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            No hay archivos visualizables
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Los archivos disponibles no se pueden previsualizar
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        {controlsVisible && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: "rgba(0,0,0,0.85)",
              paddingTop: insets.top,
              paddingBottom: 12,
              paddingHorizontal: 8,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: 4, marginRight: 8 }}>
              <Text
                style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}
                numberOfLines={1}
              >
                {archivoActual?.titulo}
              </Text>
              {archivosVisualizables.length > 1 && (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {indiceActual + 1} de {archivosVisualizables.length}
                </Text>
              )}
            </View>

            <IconButton
              icon={obtenerIconoPorTipo(archivoActual?.tipoNombre || "")}
              iconColor="rgba(255,255,255,0.7)"
              size={20}
            />
          </View>
        )}

        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={indiceActual}
          onPageSelected={onPageSelected}
          scrollEnabled={pagerEnabled}
        >
          {archivosVisualizables.map((archivo) => {
            const tipo = obtenerTipoArchivo(archivo.tipoNombre || "");

            return (
              <View key={archivo.id} style={{ flex: 1 }}>
                {tipo === "imagen" ? (
                  <ImageViewerWithZoom
                    url={archivo.webUrl}
                    onToggleControls={toggleControls}
                  />
                ) : tipo === "video" ? (
                  <VideoViewerEnhanced
                    url={archivo.webUrl}
                    onToggleControls={toggleControls}
                  />
                ) : tipo === "audio" ? (
                  <AudioViewer
                    url={archivo.webUrl}
                    titulo={archivo.titulo}
                    onToggleControls={toggleControls}
                  />
                ) : tipo === "pdf" ? (
                  <PdfViewerWithGoogleDocs
                    url={archivo.webUrl}
                    onToggleControls={toggleControls}
                    onPdfLoad={() => setControlsVisible(false)}
                  />
                ) : tipo === "word" || tipo === "excel" || tipo === "powerpoint" ? (
                  <DocumentViewer
                    url={archivo.webUrl}
                    tipo={tipo}
                    onToggleControls={toggleControls}
                  />
                ) : tipo === "texto" ? (
                  <TextViewer
                    url={archivo.webUrl}
                    onToggleControls={toggleControls}
                  />
                ) : null}
              </View>
            );
          })}
        </PagerView>

        {!pagerEnabled && archivosVisualizables.length > 1 && (
          <>
            {indiceActual > 0 && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: [{ translateY: -24 }],
                  backgroundColor: "rgba(0,0,0,0.7)",
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 99,
                }}
                onPress={() => {
                  pagerRef.current?.setPage(indiceActual - 1);
                }}
              >
                <IconButton
                  icon="chevron-left"
                  iconColor="#fff"
                  size={28}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            )}

            {indiceActual < archivosVisualizables.length - 1 && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: [{ translateY: -24 }],
                  backgroundColor: "rgba(0,0,0,0.7)",
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 99,
                }}
                onPress={() => {
                  pagerRef.current?.setPage(indiceActual + 1);
                }}
              >
                <IconButton
                  icon="chevron-right"
                  iconColor="#fff"
                  size={28}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

interface ViewerProps {
  url: string;
  onToggleControls: () => void;
  onZoomChange?: (isZoomed: boolean) => void;
}

function ImageViewerWithZoom({
  url,
  onToggleControls,
  onZoomChange,
}: ViewerProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const clampOffset = (offset: number, maxOffset: number) => {
    "worklet";
    return Math.max(-maxOffset, Math.min(maxOffset, offset));
  };

  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      focalX.value = event.focalX - SCREEN_WIDTH / 2;
      focalY.value = event.focalY - SCREEN_HEIGHT / 2;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      let newScale = savedScale.value * event.scale;
      newScale = Math.max(1, Math.min(5, newScale));
      scale.value = newScale;

      const scaleDiff = newScale - savedScale.value;
      const newX = savedTranslateX.value - focalX.value * scaleDiff;
      const newY = savedTranslateY.value - focalY.value * scaleDiff;

      const maxTranslateX = (SCREEN_WIDTH * (newScale - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (newScale - 1)) / 2;

      translateX.value = clampOffset(newX, maxTranslateX);
      translateY.value = clampOffset(newY, maxTranslateY);
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (onZoomChange) {
          runOnJS(onZoomChange)(false);
        }
      } else {
        if (onZoomChange) {
          runOnJS(onZoomChange)(true);
        }
      }
    });

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .minDistance(10)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        const newX = savedTranslateX.value + event.translationX;
        const newY = savedTranslateY.value + event.translationY;

        translateX.value = clampOffset(newX, maxTranslateX);
        translateY.value = clampOffset(newY, maxTranslateY);
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        translateX.value = withSpring(
          clampOffset(translateX.value, maxTranslateX)
        );
        translateY.value = withSpring(
          clampOffset(translateY.value, maxTranslateY)
        );
      }
    })
    .manualActivation(true)
    .onTouchesMove((event, state) => {
      if (scale.value > 1) {
        state.activate();
      } else {
        state.fail();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (onZoomChange) {
          runOnJS(onZoomChange)(false);
        }
      } else {
        const targetScale = 2.5;
        const tapX = event.x - SCREEN_WIDTH / 2;
        const tapY = event.y - SCREEN_HEIGHT / 2;

        const newX = -tapX * (targetScale - 1);
        const newY = -tapY * (targetScale - 1);

        const maxTranslateX = (SCREEN_WIDTH * (targetScale - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (targetScale - 1)) / 2;

        scale.value = withSpring(targetScale);
        translateX.value = withSpring(clampOffset(newX, maxTranslateX));
        translateY.value = withSpring(clampOffset(newY, maxTranslateY));
        if (onZoomChange) {
          runOnJS(onZoomChange)(true);
        }
      }
    });

  const singleTapGesture = Gesture.Tap().onStart(() => {
    if (scale.value <= 1) {
      runOnJS(onToggleControls)();
    }
  });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
    singleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>
          No se pudo cargar la imagen
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 16 }}>
            Cargando imagen...
          </Text>
        </View>
      )}

      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[{ flex: 1, justifyContent: "center", alignItems: "center" }]}
        >
          <Animated.Image
            source={{ uri: url }}
            style={[
              {
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              },
              animatedStyle,
            ]}
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
    </View>
  );
}

function VideoViewerEnhanced({
  url,
  onToggleControls,
}: Omit<ViewerProps, "onZoomChange">) {
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  React.useEffect(() => {
    if (status === "loading") {
      setCargando(true);
      setError(false);
    } else if (status === "readyToPlay") {
      setCargando(false);
      setError(false);
    } else if (status === "error") {
      setCargando(false);
      setError(true);
    }
  }, [status]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>
          No se pudo cargar el video
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color={theme.dark ? "#FFFFFF" : theme.colors.surface} />
          <Text style={{ color: theme.dark ? "#FFFFFF" : theme.colors.surface, marginTop: 16 }}>
            Cargando video...
          </Text>
        </View>
      )}

      <VideoView
        player={player}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
        contentFit="contain"
        allowsPictureInPicture
        nativeControls
      />
    </View>
  );
}

function AudioViewer({
  url,
  titulo,
  onToggleControls,
}: { url: string; titulo: string; onToggleControls: () => void }) {
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });

  React.useEffect(() => {
    if (status === "loading" && isInitialLoad) {
      setCargando(true);
      setError(false);
    } else if (status === "readyToPlay") {
      setCargando(false);
      setIsInitialLoad(false);
      setError(false);
      if (player.duration > 0) {
        setDuration(player.duration);
      }
    } else if (status === "error") {
      setCargando(false);
      setError(true);
    }
  }, [status, isInitialLoad]);

  
  React.useEffect(() => {
    if (!cargando && !error) {
      const interval = setInterval(() => {
        if (!isSeeking && player.playing) {
          setCurrentTime(player.currentTime);
          setIsPlaying(true);
          if (duration === 0 && player.duration > 0) {
            setDuration(player.duration);
          }
        } else if (!player.playing) {
          setIsPlaying(false);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [cargando, error, isSeeking, player, duration]);

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      if (duration > 0 && Math.abs(currentTime - duration) < 1) {
        player.currentTime = 0;
        setCurrentTime(0);
      }
      player.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
    player.currentTime = value;
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>
          No se pudo cargar el audio
        </Text>
      </View>
    );
  }

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
          Cargando audio...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center" }}>
      <View style={{ alignItems: "center", padding: 32, width: "100%" }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(255,255,255,0.1)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <IconButton 
            icon={isPlaying ? "music-note" : "music-note-outline"} 
            size={80} 
            iconColor="#fff" 
          />
        </View>

        <Text 
          style={{ 
            color: "#fff", 
            fontSize: 20, 
            fontWeight: "600",
            textAlign: "center",
            marginBottom: 8,
            paddingHorizontal: 24,
          }}
          numberOfLines={2}
        >
          {titulo}
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 24 }}>
          Archivo de audio
        </Text>

        <View style={{ width: "100%", paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {formatTime(currentTime)}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {formatTime(duration)}
            </Text>
          </View>

          <View style={{ height: 40, justifyContent: "center" }}>
            <View
              style={{
                height: 4,
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  backgroundColor: "#fff",
                }}
              />
            </View>

            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 40,
              }}
              onTouchStart={(e) => {
                setIsSeeking(true);
                const touch = e.nativeEvent;
                const width = SCREEN_WIDTH - 48;
                const position = touch.locationX;
                const percentage = Math.max(0, Math.min(1, position / width));
                handleSeek(percentage * duration);
              }}
              onTouchMove={(e) => {
                if (isSeeking) {
                  const touch = e.nativeEvent;
                  const width = SCREEN_WIDTH - 48;
                  const position = touch.locationX;
                  const percentage = Math.max(0, Math.min(1, position / width));
                  handleSeek(percentage * duration);
                }
              }}
              onTouchEnd={() => {
                setIsSeeking(false);
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
          <TouchableOpacity
            onPress={() => {
              const newTime = Math.max(0, currentTime - 10);
              handleSeek(newTime);
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(255,255,255,0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton icon="rewind-10" size={24} iconColor="#fff" style={{ margin: 0 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#fff",
              justifyContent: "center",
              alignItems: "center",
              elevation: 4,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
            }}
          >
            <IconButton
              icon={isPlaying ? "pause" : "play"}
              size={36}
              iconColor="#1a1a1a"
              style={{ margin: 0 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const newTime = Math.min(duration, currentTime + 10);
              handleSeek(newTime);
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(255,255,255,0.1)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton icon="fast-forward-10" size={24} iconColor="#fff" style={{ margin: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}>
        <VideoView
          player={player}
          style={{ width: 1, height: 1 }}
          nativeControls={false}
        />
      </View>
    </View>
  );
}

function PdfViewerWithGoogleDocs({
  url,
  onToggleControls,
  onPdfLoad,
}: Omit<ViewerProps, "onZoomChange"> & { onPdfLoad?: () => void }) {
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [intentoAlternativo, setIntentoAlternativo] = useState(false);

  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    url,
  )}&embedded=true`;
  const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
    url,
  )}`;

  const urlActual = intentoAlternativo ? pdfJsUrl : googleDocsUrl;

  if (error && intentoAlternativo) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          padding: 32,
        }}
      >
        <IconButton icon="file-pdf-box" size={64} iconColor="#ff5252" />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          No se pudo cargar el PDF
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Intenta descargarlo para verlo en otra aplicación
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(false);
            setCargando(true);
            setIntentoAlternativo(false);
          }}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      {cargando && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            {intentoAlternativo
              ? "Cargando con visor alternativo..."
              : "Cargando PDF..."}
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: urlActual }}
        style={{ flex: 1, backgroundColor: "#1a1a1a" }}
        onLoadStart={() => {
          setCargando(true);
          setError(false);
        }}
        onLoad={() => {
          setTimeout(() => {
            setCargando(false);
            if (onPdfLoad) {
              onPdfLoad();
            }
          }, 1000);
        }}
        onError={(syntheticEvent) => {
          if (!intentoAlternativo) {
            setIntentoAlternativo(true);
            setCargando(true);
            setError(false);
          } else {
            setCargando(false);
            setError(true);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

function DocumentViewer({
  url,
  tipo,
  onToggleControls,
}: {
  url: string;
  tipo: string;
  onToggleControls: () => void;
}) {
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);

  const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    url,
  )}&embedded=true`;

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          padding: 32,
        }}
      >
        <IconButton 
          icon={
            tipo === "word" ? "file-word" : 
            tipo === "excel" ? "file-excel" : 
            "file-powerpoint"
          } 
          size={64} 
          iconColor="#ff5252" 
        />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          No se pudo cargar el documento
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Intenta descargarlo para abrirlo en otra aplicación
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(false);
            setCargando(true);
          }}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      {cargando && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            backgroundColor: theme.colors.surfaceVariant,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
            Cargando documento...
          </Text>
        </View>
      )}

      <WebView
        source={{ uri: googleDocsUrl }}
        style={{ flex: 1, backgroundColor: "#1a1a1a" }}
        onLoadStart={() => {
          setCargando(true);
          setError(false);
        }}
        onLoad={() => {
          setTimeout(() => {
            setCargando(false);
          }, 1500);
        }}
        onError={() => {
          setCargando(false);
          setError(true);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  );
}

function TextViewer({
  url,
  onToggleControls,
}: Omit<ViewerProps, "onZoomChange">) {
  const { theme } = useTheme();
  const [contenido, setContenido] = useState<string>("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [zoomPercentage, setZoomPercentage] = useState(100);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  React.useEffect(() => {
    cargarTexto();
  }, [url]);

  const cargarTexto = async () => {
    try {
      setCargando(true);
      setError(false);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Error al cargar el archivo");
      }
      
      const texto = await response.text();
      setContenido(texto);
      setCargando(false);
    } catch (err) {
      console.error("Error cargando texto:", err);
      setError(true);
      setCargando(false);
    }
  };

  const updateZoomIndicator = (scaleValue: number) => {
    setZoomPercentage(Math.round(scaleValue * 100));
    setShowZoomIndicator(scaleValue !== 1);
  };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      let newScale = savedScale.value * event.scale;
      newScale = Math.max(0.5, Math.min(3, newScale));
      scale.value = newScale;
      
      const newFontSize = Math.round(16 * newScale);
      runOnJS(setFontSize)(newFontSize);
      runOnJS(updateZoomIndicator)(newScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      const currentScale = scale.value;
      if (currentScale > 1.1) {
        scale.value = withSpring(1);
        runOnJS(setFontSize)(16);
        runOnJS(updateZoomIndicator)(1);
      } else {
        scale.value = withSpring(1.5);
        runOnJS(setFontSize)(24);
        runOnJS(updateZoomIndicator)(1.5);
      }
      savedScale.value = scale.value;
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onStart(() => {
      runOnJS(onToggleControls)();
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    pinchGesture,
    singleTapGesture
  );

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          padding: 32,
        }}
      >
        <IconButton icon="file-document-alert" size={64} iconColor="#ff5252" />
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          No se pudo cargar el archivo
        </Text>
        <TouchableOpacity
          onPress={cargarTexto}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
          Cargando archivo...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <GestureDetector gesture={composedGesture}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: fontSize,
                lineHeight: fontSize * 1.5,
                fontFamily: "monospace",
              }}
              selectable={true}
            >
              {contenido}
            </Text>
          </ScrollView>
        </View>
      </GestureDetector>

      {showZoomIndicator && (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {zoomPercentage}%
          </Text>
        </View>
      )}
    </View>
  );
}
