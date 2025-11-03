import { CommentItem } from "@/app/components/comments/CommentItem";
import { Comment } from "@/app/subjects/types/comment.type";
import { comentariosService } from "@/services/comments.service";
import { likesService } from "@/services/likes.service";
import { getAuth } from "firebase/auth";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

interface CommentsModalProps {
  visible: boolean;
  onDismiss: () => void;
  publicacionId: string;
  autorPublicacionUid?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

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

  const slideAnim = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: MODAL_HEIGHT,
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    commentsList: {
      flex: 1,
    },
    commentsContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    inputContainer: {
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: Platform.OS === "ios" ? 8 : 4,
    },
    replyingTo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      minHeight: 48,
    },
    textInput: {
      flex: 1,
      marginRight: 8,
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
      marginLeft: 8,
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
      iniciarSuscripcion();
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
      ]).start();
    } else {
      detenerSuscripcion();
    }

    return () => {
      detenerSuscripcion();
    };
  }, [visible, iniciarSuscripcion, detenerSuscripcion]);

  const handleDismiss = () => {
    Keyboard.dismiss();
    detenerSuscripcion();

    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setReplyingTo(null);
      setCommentText("");
      setKeyboardHeight(0);
      onDismiss();
    });
  };

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

  const handleLikeToggle = async (commentId: string) => {
    if (!auth.currentUser) return;

    try {
      await likesService.darLike(auth.currentUser.uid, undefined, commentId);
    } catch (error) {
      console.error("Error al toggle like:", error);
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
      onLikeToggle={handleLikeToggle}
      autorPublicacionUid={autorPublicacionUid}
    />
  );

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <SafeAreaView edges={["top"]} style={{ flex: 1 }} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              marginBottom:
                keyboardHeight > 0
                  ? keyboardHeight - (Platform.OS === "ios" ? 34 : 0)
                  : 0,
            },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.handle} />
            </TouchableWithoutFeedback>

            <View style={styles.header}>
              <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                Comentarios ({comments.length})
              </Text>
              <IconButton icon="close" size={24} onPress={handleDismiss} />
            </View>

            <View style={styles.commentsList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text
                    style={{
                      marginTop: 16,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    Cargando comentarios...
                  </Text>
                </View>
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
                  contentContainerStyle={styles.commentsContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  removeClippedSubviews={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={15}
                  windowSize={10}
                />
              )}
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={[
                styles.inputContainer,
                Platform.OS === "android" && { paddingBottom: 8 },
              ]}
            >
              {replyingTo && (
                <View style={styles.replyingTo}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginRight: 8,
                      }}
                    >
                      Respondiendo a:
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "bold",
                      }}
                      numberOfLines={1}
                    >
                      {truncarNombre(replyingTo.autorNombre || "Usuario")}
                    </Text>
                  </View>
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={cancelReply}
                    iconColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              )}

              <View style={styles.inputRow}>
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
                  style={styles.textInput}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  dense
                  autoFocus={false}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="default"
                />
                <IconButton
                  icon="send"
                  size={24}
                  onPress={handleSubmit}
                  disabled={!commentText.trim() || submitting}
                  iconColor={
                    commentText.trim() && !submitting
                      ? theme.colors.primary
                      : theme.colors.onSurfaceDisabled
                  }
                  style={styles.sendButton}
                />
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default CommentsModal;