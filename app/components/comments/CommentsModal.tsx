import { CommentItem } from "@/app/components/comments/CommentItem";
import { Comment } from "@/app/subjects/types/comment.type";
import { comentariosService } from "@/services/comments.service";
import { getAuth } from "firebase/auth";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  Avatar,
  IconButton,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommentsModalSkeleton } from "./CommentsSkeleton";

interface CommentsModalProps {
  visible: boolean;
  onDismiss: () => void;
  publicacionId: string;
  autorPublicacionUid?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT_SMALL = SCREEN_HEIGHT * 0.6; // Altura inicial (60%)
const MODAL_HEIGHT_LARGE = SCREEN_HEIGHT * 0.95; // Altura expandida (95%)

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onDismiss,
  publicacionId,
  autorPublicacionUid,
}) => {
  const theme = useTheme();
  const auth = getAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const modalHeight = useRef(new Animated.Value(MODAL_HEIGHT_SMALL)).current;
  const currentHeight = useRef(MODAL_HEIGHT_SMALL);
  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT_SMALL)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.outline,
      borderRadius: 2,
      alignSelf: "center",
      marginVertical: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    commentsList: {
      flex: 1,
    },
    commentsContent: {
      paddingHorizontal: 16,
    },
    inputContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    replyingTo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingVertical: 4,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
    },
    textInput: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: theme.colors.surface,
      minHeight: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    sendButton: {
      margin: 0,
      position: 'absolute',
      right: 0,
    },
  });

  // Utilidades
  const truncarNombre = (nombre: string): string => {
    if (!nombre) return "Usuario";
    if (nombre.length <= 20) return nombre;

    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      return nombre.substring(0, 17) + "...";
    }
    return `${partes[0]} ${partes[1]}`.substring(0, 20) + "...";
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText("");
  };

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT_SMALL,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(modalHeight, {
        toValue: MODAL_HEIGHT_SMALL,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setReplyingTo(null);
      setCommentText("");
      setKeyboardHeight(0);
      onDismiss();
    });
  }, [overlayAnim, slideAnim, modalHeight, onDismiss]);

  // PanResponder que sigue tu dedo fluidamente
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dy) > 5;
        },
        onPanResponderGrant: () => {
          // Guardar la altura actual al empezar el gesto
          currentHeight.current = currentHeight.current;
        },
        onPanResponderMove: (_, gestureState) => {
          // Calcular nueva altura basada en el movimiento
          const newHeight = Math.max(
            MODAL_HEIGHT_SMALL,
            Math.min(MODAL_HEIGHT_LARGE, currentHeight.current - gestureState.dy)
          );

          modalHeight.setValue(newHeight);
        },
        onPanResponderRelease: (_, gestureState) => {
          const finalHeight = currentHeight.current - gestureState.dy;
          const midPoint = (MODAL_HEIGHT_SMALL + MODAL_HEIGHT_LARGE) / 2;

          let targetHeight;

          if (gestureState.vy > 0.5) {
            // Swipe rápido hacia abajo
            if (finalHeight < midPoint) {
              handleDismiss();
              return;
            } else {
              targetHeight = MODAL_HEIGHT_SMALL;
            }
          } else if (gestureState.vy < -0.5) {
            // Swipe rápido hacia arriba
            targetHeight = MODAL_HEIGHT_LARGE;
          } else {
            // Snap al más cercano
            targetHeight = finalHeight > midPoint ? MODAL_HEIGHT_LARGE : MODAL_HEIGHT_SMALL;
          }

          currentHeight.current = targetHeight;
          Animated.spring(modalHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            friction: 10,
            tension: 50,
          }).start();
        },
      }),
    [modalHeight, currentHeight, handleDismiss]
  );

  // Efectos y handlers (mantener igual que antes)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const iniciarSuscripcion = useCallback(() => {
    if (!publicacionId || !visible) return;

    setLoading(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = comentariosService.suscribirseAComentarios(
      publicacionId,
      (comentarios) => {
        setComments(comentarios);
        setLoading(false);

        if (comentarios.length > comments.length) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 300);
        }
      }
    );
  }, [publicacionId, visible]);

  const detenerSuscripcion = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (visible) {
      dragY.setValue(0);
      modalHeight.setValue(MODAL_HEIGHT_SMALL);
      currentHeight.current = MODAL_HEIGHT_SMALL;
      iniciarSuscripcion();
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: (t) => {
            // Ease out cubic para animación más suave
            return 1 - Math.pow(1 - t, 3);
          },
        }),
      ]).start(() => {
        currentHeight.current = MODAL_HEIGHT_SMALL;
      });
    } else {
      detenerSuscripcion();
      currentHeight.current = MODAL_HEIGHT_SMALL;
      modalHeight.setValue(MODAL_HEIGHT_SMALL);
    }

    return () => {
      detenerSuscripcion();
    };
  }, [visible, iniciarSuscripcion, detenerSuscripcion, dragY, overlayAnim, slideAnim, modalHeight, currentHeight]);

  const handleSubmit = async () => {
    if (!commentText.trim() || !auth.currentUser) return;

    setSubmitting(true);
    try {
      const comentarioPadreId = replyingTo?.id || null;

      await comentariosService.crearComentario({
        publicacionId,
        autorUid: auth.currentUser.uid,
        autorNombre: auth.currentUser.displayName || "Usuario",
        autorFoto: auth.currentUser.photoURL || null,
        contenido: commentText.trim(),
        estado: "activo",
        likes: 0,
        comentarioPadreId: comentarioPadreId,
        nivel: replyingTo ? (replyingTo.nivel || 0) + 1 : 0,
      });

      setCommentText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error enviando comentario:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await comentariosService.eliminarComentario(commentId, publicacionId);
    } catch (error) {
      console.error("Error eliminando comentario:", error);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onReply={handleReply}
      onDelete={handleDelete}
      autorPublicacionUid={autorPublicacionUid}
    />
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [
            { translateY: Animated.add(slideAnim, dragY) }
          ],
        }}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              height: modalHeight,
            },
          ]}
        >
          <View style={{ height: '100%', flexDirection: 'column' }}>
            <View {...panResponder.panHandlers}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text variant="titleMedium" style={{ fontWeight: "bold", textAlign: "center", flex: 1 }}>
                  Comentarios
                </Text>
              </View>
            </View>

            <View style={styles.commentsList}>
              {loading && comments.length === 0 ?  (
                 <CommentsModalSkeleton />
              ) : comments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    Sé el primero en comentar
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.primary, marginTop: 8 }}
                  >
                    ¡Comparte tu opinión!
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={comments}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCommentItem}
                  contentContainerStyle={[
                    styles.commentsContent,
                    { paddingBottom: 120 }
                  ]}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  removeClippedSubviews={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={15}
                  windowSize={10}
                  scrollEventThrottle={16}
                />
              )}
            </View>

          <SafeAreaView edges={["bottom"]} style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
            {replyingTo && (
              <View style={styles.replyingTo}>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    fontSize: 12,
                  }}
                >
                  Respondiendo a{" "}
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: "600",
                    }}
                  >
                    {truncarNombre(replyingTo.autorNombre || "Usuario")}
                  </Text>
                </Text>
                <IconButton
                  icon="close"
                  size={16}
                  onPress={cancelReply}
                  iconColor={theme.colors.onSurfaceVariant}
                  style={{ margin: 0 }}
                />
              </View>
            )}

            <View style={styles.inputRow}>
              {auth.currentUser?.photoURL ? (
                <Avatar.Image
                  size={36}
                  source={{ uri: auth.currentUser.photoURL }}
                  style={{ marginRight: 8 }}
                />
              ) : (
                <Avatar.Text
                  size={36}
                  label={auth.currentUser?.displayName?.charAt(0).toUpperCase() || "U"}
                  style={{ marginRight: 8 }}
                />
              )}
              <View style={{ flex: 1, position: 'relative' }}>
                <TextInput
                  mode="outlined"
                  placeholder={
                    replyingTo
                      ? "Escribe tu respuesta..."
                      : "Añade un comentario..."
                  }
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  style={[styles.textInput, commentText.trim() && { paddingRight: 48 }]}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  dense
                  autoFocus={false}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="default"
                  onFocus={() => {
                    currentHeight.current = MODAL_HEIGHT_LARGE;
                    Animated.spring(modalHeight, {
                      toValue: MODAL_HEIGHT_LARGE,
                      useNativeDriver: false,
                      friction: 10,
                      tension: 50,
                    }).start();
                  }}
                />
                {commentText.trim() && (
                  <IconButton
                    icon="send"
                    size={20}
                    onPress={handleSubmit}
                    disabled={submitting}
                    iconColor={theme.colors.primary}
                    style={styles.sendButton}
                  />
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default CommentsModal;