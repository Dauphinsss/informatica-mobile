import React, { useState, useRef, useCallback } from "react";
import { 
  View, 
  Image, 
  TouchableOpacity, 
  StatusBar, 
  Platform, 
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
} from "react-native";
import {
  Appbar,
  ActivityIndicator,
  Text,
  IconButton,
} from "react-native-paper";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import Pdf from "react-native-pdf";
import PagerView from "react-native-pager-view";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const THUMBNAIL_BAR_HEIGHT = 120;
const SWIPE_THRESHOLD = 50;

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

export default function FileGalleryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const { archivos, indiceInicial } = route.params as RouteParams;
  
  const [indiceActual, setIndiceActual] = useState(indiceInicial);
  const [thumbnailsVisible, setThumbnailsVisible] = useState(false);
  const pagerRef = useRef<PagerView>(null);
  
  // Animación solo para thumbnails (header siempre arriba)
  const thumbnailAnim = useRef(new Animated.Value(THUMBNAIL_BAR_HEIGHT)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const obtenerTipoArchivo = (tipoNombre: string): string => {
    const tipo = tipoNombre?.toLowerCase() || "";
    if (tipo.includes("pdf")) return "pdf";
    if (tipo.includes("imagen") || tipo.includes("image")) return "imagen";
    if (tipo.includes("video")) return "video";
    return "otro";
  };

  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const toggleThumbnails = () => {
    const toValue = thumbnailsVisible ? THUMBNAIL_BAR_HEIGHT : 0;
    const opacityValue = thumbnailsVisible ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(thumbnailAnim, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }),
      Animated.timing(headerOpacity, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setThumbnailsVisible(!thumbnailsVisible);
  };

  const onPageSelected = useCallback((e: any) => {
    setIndiceActual(e.nativeEvent.position);
  }, []);

  const scrollToPage = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const archivoActual = archivos[indiceActual];

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header flotante FIJO (no se mueve) */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.7)",
          paddingTop: insets.top,
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          opacity: headerOpacity,
        }}
        pointerEvents={thumbnailsVisible ? "auto" : "none"}
      >
        <IconButton
          icon="arrow-left"
          iconColor="#fff"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }} numberOfLines={1}>
            {archivoActual?.titulo}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
            {indiceActual + 1} de {archivos.length} • {formatearTamano(archivoActual?.tamanoBytes)}
          </Text>
        </View>
        <IconButton icon="share-variant" iconColor="#fff" size={20} onPress={() => {}} />
        <IconButton icon="download" iconColor="#fff" size={20} onPress={() => {}} />
      </Animated.View>

      {/* Galería principal */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={indiceInicial}
        onPageSelected={onPageSelected}
      >
        {archivos.map((archivo) => (
          <View key={archivo.id} style={{ flex: 1 }}>
            {obtenerTipoArchivo(archivo.tipoNombre || "") === "imagen" ? (
              <ImageViewer
                url={archivo.webUrl}
                onToggleThumbnails={toggleThumbnails}
              />
            ) : obtenerTipoArchivo(archivo.tipoNombre || "") === "video" ? (
              <VideoViewer
                url={archivo.webUrl}
                onToggleThumbnails={toggleThumbnails}
              />
            ) : obtenerTipoArchivo(archivo.tipoNombre || "") === "pdf" ? (
              <PdfViewer
                url={archivo.webUrl}
                onToggleThumbnails={toggleThumbnails}
              />
            ) : (
              <UnsupportedFile fileName={archivo.titulo} fileSize={archivo.tamanoBytes} />
            )}
          </View>
        ))}
      </PagerView>

      {/* Barra de thumbnails */}
      {archivos.length > 1 && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: THUMBNAIL_BAR_HEIGHT,
            backgroundColor: "rgba(0,0,0,0.9)",
            paddingTop: 10,
            paddingHorizontal: 16,
            transform: [{ translateY: thumbnailAnim }],
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 12, height: "100%" }}
          >
            {archivos.map((archivo, index) => {
              const tipoArchivo = obtenerTipoArchivo(archivo.tipoNombre || "");
              const esActual = index === indiceActual;

              return (
                <TouchableOpacity
                  key={archivo.id}
                  onPress={() => scrollToPage(index)}
                  activeOpacity={0.7}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    overflow: "hidden",
                    borderWidth: esActual ? 3 : 1,
                    borderColor: esActual ? theme.colors.primary : "rgba(255,255,255,0.3)",
                  }}
                >
                  {tipoArchivo === "imagen" ? (
                    <Image
                      source={{ uri: archivo.webUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        icon={
                          tipoArchivo === "pdf"
                            ? "file-pdf-box"
                            : tipoArchivo === "video"
                            ? "video"
                            : "file-document"
                        }
                        size={24}
                        iconColor={esActual ? theme.colors.primary : "#fff"}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Indicador de swipe */}
          <View
            style={{
              position: "absolute",
              top: 4,
              alignSelf: "center",
              width: 40,
              height: 4,
              backgroundColor: "rgba(255,255,255,0.3)",
              borderRadius: 2,
            }}
          />
        </Animated.View>
      )}

      {/* Botón flotante para mostrar thumbs */}
      <SwipeUpIndicator
        onSwipeUp={toggleThumbnails}
        thumbnailsVisible={thumbnailsVisible}
      />
    </View>
  );
}

// ============ INDICADOR PARA SWIPE UP ============
function SwipeUpIndicator({ onSwipeUp, thumbnailsVisible }: any) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(thumbnailsVisible ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: thumbnailsVisible ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [thumbnailsVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          onSwipeUp();
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (thumbnailsVisible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <IconButton icon="chevron-up" iconColor="#fff" size={20} />
      <Text style={{ color: "#fff", fontSize: 14 }}>Desliza para ver más</Text>
    </Animated.View>
  );
}

// ============ IMAGE VIEWER CON ZOOM ============
interface ImageViewerProps {
  url: string;
  onToggleThumbnails: () => void;
}

function ImageViewer({ url, onToggleThumbnails }: ImageViewerProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const lastTap = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          // Double tap
          if (lastScale.current > 1) {
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
              Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
            lastScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          } else {
            Animated.timing(scale, { toValue: 2.5, duration: 200, useNativeDriver: true }).start();
            lastScale.current = 2.5;
          }
        } else {
          // Single tap
          if (lastScale.current <= 1) {
            onToggleThumbnails();
          }
        }
        lastTap.current = now;
      },
      onPanResponderMove: (_, gestureState) => {
        if (lastScale.current > 1) {
          const maxTranslateX = (SCREEN_WIDTH * (lastScale.current - 1)) / 2;
          const maxTranslateY = (SCREEN_HEIGHT * (lastScale.current - 1)) / 2;
          
          const newX = Math.max(-maxTranslateX, Math.min(maxTranslateX, lastTranslateX.current + gestureState.dx));
          const newY = Math.max(-maxTranslateY, Math.min(maxTranslateY, lastTranslateY.current + gestureState.dy));
          
          translateX.setValue(newX);
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (lastScale.current > 1) {
          lastTranslateX.current += gestureState.dx;
          lastTranslateY.current += gestureState.dy;
          
          const maxTranslateX = (SCREEN_WIDTH * (lastScale.current - 1)) / 2;
          const maxTranslateY = (SCREEN_HEIGHT * (lastScale.current - 1)) / 2;
          
          lastTranslateX.current = Math.max(-maxTranslateX, Math.min(maxTranslateX, lastTranslateX.current));
          lastTranslateY.current = Math.max(-maxTranslateY, Math.min(maxTranslateY, lastTranslateY.current));
        }
      },
    })
  ).current;

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>No se pudo cargar la imagen</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View style={{ position: "absolute", zIndex: 10, alignSelf: "center", top: "45%" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Cargando...</Text>
        </View>
      )}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          flex: 1,
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        }}
      >
        <Image
          source={{ uri: url }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode="contain"
          onLoadStart={() => setCargando(true)}
          onLoadEnd={() => setCargando(false)}
          onError={() => {
            setCargando(false);
            setError(true);
          }}
        />
      </Animated.View>
    </View>
  );
}

// ============ VIDEO VIEWER ============
function VideoViewer({ url, onToggleThumbnails }: ImageViewerProps) {
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
        <View style={{ position: "absolute", zIndex: 10, alignSelf: "center", top: "45%" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Cargando...</Text>
        </View>
      )}
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1}
        onPress={onToggleThumbnails}
      >
        <VideoView
          player={player}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          contentFit="contain"
          allowsPictureInPicture
          nativeControls
        />
      </TouchableOpacity>
    </View>
  );
}

// ============ PDF VIEWER ============
function PdfViewer({ url, onToggleThumbnails }: ImageViewerProps) {
  const [error, setError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <IconButton icon="alert-circle" size={48} iconColor="#ff5252" />
        <Text style={{ color: "#fff", marginTop: 12 }}>No se pudo cargar el PDF</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {cargando && (
        <View style={{ position: "absolute", zIndex: 10, alignSelf: "center", top: "45%" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Cargando PDF...</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1}
        onPress={onToggleThumbnails}
      >
        <Pdf
          source={{ uri: url, cache: true }}
          style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          onLoadProgress={(percent) => {
            if (percent === 1) setCargando(false);
          }}
          onLoadComplete={(numberOfPages) => {
            setTotalPaginas(numberOfPages);
            setCargando(false);
          }}
          onPageChanged={(page) => {
            setPaginaActual(page);
          }}
          onError={(error) => {
            console.error("Error PDF:", error);
            setCargando(false);
            setError(true);
          }}
          enablePaging={true}
          horizontal={false}
          spacing={0}
          trustAllCerts={false}
          fitPolicy={2}
        />
      </TouchableOpacity>
      
      {totalPaginas > 0 && !cargando && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12 }}>
            {paginaActual} / {totalPaginas}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============ ARCHIVO NO SOPORTADO ============
function UnsupportedFile({ fileName, fileSize }: { fileName: string; fileSize: number }) {
  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000", padding: 32 }}>
      <IconButton icon="file-document-outline" size={64} iconColor="#fff" />
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", marginTop: 16, textAlign: "center" }}>
        {fileName}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 4 }}>
        {formatearTamano(fileSize)}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 16, textAlign: "center" }}>
        Vista previa no disponible
      </Text>
    </View>
  );
}