import { Comment } from "@/app/subjects/types/comment.type";
import { useTheme } from "@/contexts/ThemeContext";
import { comentariosService } from "@/services/comments.service";
import { getAuth } from "firebase/auth";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Menu, Text } from "react-native-paper";
import { CommentInput } from "./CommentInput";
import { LikeButton } from "./LikeButton";

interface CommentItemProps {
  comment: Comment;
  publicacionId: string;
  onCommentAdded: () => void;
  nivel?: number;
  scrollToInput?: () => void;
  registerInputRef?: (commentId: string, ref: View | null) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  publicacionId,
  onCommentAdded,
  nivel = 0,
  scrollToInput,
  registerInputRef,
}) => {
  const { theme } = useTheme();
  const auth = getAuth();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const replyInputRef = useRef<View>(null);
  React.useEffect(() => {
    if (registerInputRef) {
      if (showReplyInput) {
        registerInputRef(comment.id, replyInputRef.current as any);
      } else {
        registerInputRef(comment.id, null);
      }
    }
    return () => {
      if (registerInputRef) registerInputRef(comment.id, null);
    };
  }, [showReplyInput]);

  const styles = StyleSheet.create({
    container: {
      marginLeft: nivel * 16,
      marginVertical: 4,
    },
    commentContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    contentContainer: {
      flex: 1,
      marginLeft: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    leftActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    rightActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    replyButton: {
      marginLeft: -8,
    },
    repliesContainer: {
      marginTop: 8,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.outline,
      paddingLeft: 12,
    },
    menuButton: {
      margin: 0,
    },
  });

  const handleReply = () => {
    setShowReplyInput(!showReplyInput);
    if (!showReplyInput) {
      setTimeout(() => {
        scrollToInput?.();
      }, 100);
    }
  };

  const handleReplySubmit = async (contenido: string) => {
    if (!auth.currentUser) return;

    try {
      await comentariosService.crearComentario({
        publicacionId,
        autorUid: auth.currentUser.uid,
        autorNombre: auth.currentUser.displayName || "Usuario",
        autorFoto: auth.currentUser.photoURL || undefined,
        contenido,
        estado: "activo",
        likes: 0,
        comentarioPadreId: comment.id,
        nivel: nivel + 1,
      });

      setShowReplyInput(false);
      onCommentAdded();
    } catch (error) {
      console.error("Error creando respuesta:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await comentariosService.eliminarComentario(comment.id, publicacionId);
      onCommentAdded();
      setMenuVisible(false);
    } catch (error) {
      console.error("Error eliminando comentario:", error);
    }
  };

  const puedeEliminar = auth.currentUser?.uid === comment.autorUid;

  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Ahora";
    if (diffMin < 60) return `hace ${diffMin}m`;
    if (diffHrs < 24) return `hace ${diffHrs}h`;
    if (diffDias < 7) return `hace ${diffDias}d`;
    return fecha.toLocaleDateString("es-BO");
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentContainer}>
        {comment.autorFoto ? (
          <Avatar.Image
            size={32}
            source={{ uri: comment.autorFoto }}
            style={{ backgroundColor: theme.colors.outline }}
          />
        ) : (
          <Avatar.Text
            size={32}
            label={comment.autorNombre?.charAt(0).toUpperCase() || "U"}
            style={{ backgroundColor: theme.colors.primary }}
          />
        )}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text
              variant="bodyMedium"
              style={{ fontWeight: "bold", color: theme.colors.onSurface }}
            >
              {comment.autorNombre}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
            >
              {formatearFecha(comment.fechaCreacion)}
            </Text>

            {puedeEliminar && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-horizontal"
                    size={16}
                    onPress={() => setMenuVisible(true)}
                    style={styles.menuButton}
                  />
                }
              >
                <Menu.Item onPress={handleDelete} title="Eliminar" />
              </Menu>
            )}
          </View>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {comment.contenido}
          </Text>

          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <LikeButton
                comentarioId={comment.id}
                size={16}
                showCount={true}
              />
            </View>

            <View style={styles.rightActions}>
              {nivel < 2 && (
                <IconButton
                  icon="reply"
                  size={16}
                  onPress={handleReply}
                  style={styles.replyButton}
                />
              )}
            </View>
          </View>

          {showReplyInput && (
            <View ref={replyInputRef}>
              <CommentInput
                publicacionId={publicacionId}
                placeholder="Escribe una respuesta..."
                onSubmit={handleReplySubmit}
                onCancel={() => setShowReplyInput(false)}
                autoFocus
              />
            </View>
          )}
        </View>
      </View>

      {/* Respuestas */}
      {comment.respuestas && comment.respuestas.length > 0 && (
        <View style={styles.repliesContainer}>
          {!showReplies && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.primary, marginBottom: 8 }}
              onPress={() => setShowReplies(true)}
            >
              Ver {comment.respuestas.length} respuesta
              {comment.respuestas.length !== 1 ? "s" : ""}
            </Text>
          )}

          {showReplies &&
            comment.respuestas.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                publicacionId={publicacionId}
                onCommentAdded={onCommentAdded}
                nivel={nivel + 1}
                scrollToInput={scrollToInput}
              />
            ))}

          {showReplies && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.primary, marginTop: 8 }}
              onPress={() => setShowReplies(false)}
            >
              Ocultar respuestas
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
