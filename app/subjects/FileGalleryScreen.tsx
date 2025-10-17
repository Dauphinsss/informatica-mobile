import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  StatusBar,
  TouchableOpacity,
  View
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerView from "react-native-pager-view";
import {
  ActivityIndicator,
  IconButton,
  Text,
} from "react-native-paper";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from "react-native-webview";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Archivo {
  id: string;
  titulo: string;
  webUrl: string;
  tipoNombre?: string;
  tamanoBytes: number;
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
  return "otro";
};

export default function FileGalleryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const { archivos, indiceInicial } = route.params as RouteParams;
  
  const archivosVisualizables = archivos.filter(archivo => {
    const tipo = obtenerTipoArchivo(archivo.tipoNombre || "");
    return tipo === "pdf" || tipo === "imagen" || tipo === "video";
  });

  const indiceInicialAjustado = archivosVisualizables.findIndex(
    a => a.id === archivos[indiceInicial].id
  );
  
  const [indiceActual, setIndiceActual] = useState(indiceInicialAjustado >= 0 ? indiceInicialAjustado : 0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const pagerRef = useRef<PagerView>(null);
  
  // Controlar si el PagerView debe responder a gestos
  const [pagerEnabled, setPagerEnabled] = useState(true);

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    return "file-document";
  };

  const onPageSelected = useCallback((e: any) => {
    setIndiceActual(e.nativeEvent.position);
  }, []);

  const toggleControls = () => {
    setControlsVisible(!controlsVisible);
  };

  const archivoActual = archivosVisualizables[indiceActual];

  if (archivosVisualizables.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <IconButton icon="file-document-alert" size={64} iconColor="#fff" />
          <Text style={{ color: "#fff", fontSize: 18, marginTop: 16, textAlign: "center" }}>
            No hay archivos visualizables
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8, textAlign: "center" }}>
            Los archivos disponibles no se pueden previsualizar
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              marginTop: 24, 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              backgroundColor: theme.colors.primary,
              borderRadius: 8 
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
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
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
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }} numberOfLines={1}>
                {archivoActual?.titulo}
              </Text>
              {archivosVisualizables.length > 1 && (
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
                  {indiceActual + 1} de {archivosVisualizables.length}
                </Text>
              )}
            </View>
            
            <IconButton
              icon={obtenerIconoPorTipo(archivoActual?.tipoNombre || "")}
              iconColor="rgba(255,255,255,0.7)"
              size={20}
            />
            
            <IconButton 
              icon="download" 
              iconColor="#fff" 
              size={22} 
              onPress={() => {
                // Implementar descarga
              }} 
            />
            <IconButton 
              icon="dots-vertical" 
              iconColor="#fff" 
              size={22} 
              onPress={() => {
                // Menú adicional
              }} 
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
                ) : tipo === "pdf" ? (
                  <PdfViewerWithGoogleDocs
                    url={archivo.webUrl}
                    onToggleControls={toggleControls}
                    onPdfLoad={() => setControlsVisible(false)}
                  />
                ) : null}
              </View>
            );
          })}
        </PagerView>
      </View>
    </GestureHandlerRootView>
  );
}

// ============ VISOR DE IMÁGENES CON ZOOM MEJORADO (REANIMATED V3) ============
interface ViewerProps {
  url: string;
  onToggleControls: () => void;
  onZoomChange?: (isZoomed: boolean) => void;
}

function ImageViewerWithZoom({ url, onToggleControls, onZoomChange }: ViewerProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  
  // Shared values para animaciones
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  
  const lastTap = useRef(0);

  // Función para aplicar límites
  const clampOffset = (offset: number, maxOffset: number) => {
    'worklet';
    return Math.max(-maxOffset, Math.min(maxOffset, offset));
  };

  // Gestos con Gesture Handler
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      focalX.value = event.focalX - SCREEN_WIDTH / 2;
      focalY.value = event.focalY - SCREEN_HEIGHT / 2;
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Calcular nueva escala
      let newScale = savedScale.value * event.scale;
      newScale = Math.max(1, Math.min(5, newScale));
      scale.value = newScale;

      // Calcular nuevo offset considerando el punto focal
      const scaleDiff = newScale - savedScale.value;
      const newX = savedTranslateX.value - focalX.value * scaleDiff;
      const newY = savedTranslateY.value - focalY.value * scaleDiff;

      // Aplicar límites
      const maxTranslateX = (SCREEN_WIDTH * (newScale - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (newScale - 1)) / 2;

      translateX.value = clampOffset(newX, maxTranslateX);
      translateY.value = clampOffset(newY, maxTranslateY);
    })
    .onEnd(() => {
      // Si el zoom es muy pequeño, resetear
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
      // Ajustar dentro de límites con animación
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        translateX.value = withSpring(clampOffset(translateX.value, maxTranslateX));
        translateY.value = withSpring(clampOffset(translateY.value, maxTranslateY));
      }
    })
    .manualActivation(true)
    .onTouchesMove((event, state) => {
      // Solo activar el pan si hay zoom
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
        // Zoom out
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        if (onZoomChange) {
          runOnJS(onZoomChange)(false);
        }
      } else {
        // Zoom in hacia el punto del tap
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

  const singleTapGesture = Gesture.Tap()
    .onStart(() => {
      if (scale.value <= 1) {
        runOnJS(onToggleControls)();
      }
    });

  // Combinar gestos
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>No se pudo cargar la imagen</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: "center", 
          alignItems: "center",
          zIndex: 10,
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 16 }}>Cargando imagen...</Text>
        </View>
      )}

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Animated.Image
            source={{ uri: url }}
            style={[
              { 
                width: SCREEN_WIDTH, 
                height: SCREEN_HEIGHT,
              },
              animatedStyle
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

// ============ VISOR DE VIDEO ============
function VideoViewerEnhanced({ url, onToggleControls }: Omit<ViewerProps, 'onZoomChange'>) {
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.muted = false;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  React.useEffect(() => {
    if (status === 'loading') {
      setCargando(true);
      setError(false);
    } else if (status === 'readyToPlay') {
      setCargando(false);
      setError(false);
    } else if (status === 'error') {
      setCargando(false);
      setError(true);
    }
  }, [status]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>No se pudo cargar el video</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: "center", 
          alignItems: "center",
          zIndex: 10,
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 16 }}>Cargando video...</Text>
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

// ============ VISOR DE PDF CON GOOGLE DOCS VIEWER ============
function PdfViewerWithGoogleDocs({ url, onToggleControls, onPdfLoad }: Omit<ViewerProps, 'onZoomChange'> & { onPdfLoad?: () => void }) {
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [intentoAlternativo, setIntentoAlternativo] = useState(false);

  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  const pdfJsUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`;

  const urlActual = intentoAlternativo ? pdfJsUrl : googleDocsUrl;

  if (error && intentoAlternativo) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a", padding: 32 }}>
        <IconButton icon="file-pdf-box" size={64} iconColor="#ff5252" />
        <Text style={{ color: "#fff", fontSize: 18, marginTop: 16, textAlign: "center" }}>
          No se pudo cargar el PDF
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8, textAlign: "center" }}>
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
            borderColor: "rgba(255,255,255,0.2)"
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
        <View style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: "center", 
          alignItems: "center",
          zIndex: 10,
          backgroundColor: "#1a1a1a"
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 16 }}>
            {intentoAlternativo ? "Cargando con visor alternativo..." : "Cargando PDF..."}
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
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          
          if (!intentoAlternativo) {
            console.log('Intentando con visor alternativo...');
            setIntentoAlternativo(true);
            setCargando(true);
            setError(false);
          } else {
            setCargando(false);
            setError(true);
          }
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('HTTP error:', nativeEvent.statusCode);
          
          if (nativeEvent.statusCode >= 400) {
            if (!intentoAlternativo) {
              setIntentoAlternativo(true);
              setCargando(true);
              setError(false);
            } else {
              setCargando(false);
              setError(true);
            }
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        cacheEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        setSupportMultipleWindows={false}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}