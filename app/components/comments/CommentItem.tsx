import { Comment } from "@/app/subjects/types/comment.type";
import { comentariosService } from "@/services/comments.service";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Menu, Text, useTheme } from "react-native-paper";

interface CommentItemProps {
  comment: Comment;
  nivel?: number;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLikeToggle: (commentId: string) => void;
  autorPublicacionUid?: string;
  readOnly?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  nivel = 0,
  onReply,
  onDelete,
  onLikeToggle,
  autorPublicacionUid,
  readOnly = false,
}) => {
  const theme = useTheme();
  const auth = getAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes || 0);

  // Verificar permisos de eliminación
  const puedeEliminar =
    auth.currentUser &&
    (auth.currentUser.uid === comment.autorUid ||
      auth.currentUser.uid === autorPublicacionUid);

  // SOLO suscribirse a likes, NO al comentario completo
  useEffect(() => {
    if (!comment.id || !auth.currentUser || readOnly) return;

    const unsubscribe = comentariosService.suscribirseALikesComentario(
      comment.id,
      (likes, liked) => {
        setLikeCount(likes);
        setUserLiked(liked);
      }
    );

    return unsubscribe;
  }, [comment.id, auth.currentUser, readOnly]);

  const styles = StyleSheet.create({
    container: {
      marginLeft: nivel * 16,
      marginVertical: 8,
    },
    commentContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    contentContainer: {
      flex: 1,
      marginLeft: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    autorInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      flexWrap: "wrap",
    },
    autorNombre: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      marginRight: 8,
      fontSize: 14,
    },
    fecha: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    contenido: {
      color: theme.colors.onSurface,
      lineHeight: 20,
      marginBottom: 8,
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
    },
    likeButton: {
      margin: 0,
      marginRight: 4,
    },
    replyButton: {
      margin: 0,
      marginLeft: 8,
    },
    repliesContainer: {
      marginTop: 12,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.outline,
      paddingLeft: 12,
    },
    viewRepliesText: {
      color: theme.colors.primary,
      fontSize: 14,
      marginTop: 8,
    },
    disabledAction: {
      opacity: 0.4,
    },
    staticLikeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 4,
    },
    staticLikeText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginLeft: 4,
    },
  });

  // Función handleLikeToggle modificada para readOnly
  const handleLikeToggle = async () => {
    if (readOnly) {
      // En modo readOnly, no hacer absolutamente nada
      return;
    }

    if (!auth.currentUser) return;

    try {
      const newLikedState = !userLiked;
      setUserLiked(newLikedState);
      setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1));

      await onLikeToggle(comment.id);
    } catch (error) {
      console.error("Error al toggle like:", error);
      setUserLiked(!userLiked);
      setLikeCount((prev) => (userLiked ? prev + 1 : prev - 1));
    }
  };

  // Función para manejar el menú en modo readOnly
  const handleMenuPress = () => {
    if (readOnly) {
      // En modo readOnly, no hacer nada
      return;
    }
    setMenuVisible(true);
  };

  // Función para manejar reply en modo readOnly
  const handleReplyPress = () => {
    if (readOnly) {
      // En modo readOnly, no hacer nada
      return;
    }
    onReply(comment);
  };

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

  const truncarNombre = (nombre: string): string => {
    if (!nombre) return "Usuario";
    if (nombre.length <= 20) return nombre;

    const partes = nombre.trim().split(/\s+/);
    if (partes.length === 1) {
      return nombre.substring(0, 17) + "...";
    }

    return `${partes[0]} ${partes[1]}`.substring(0, 20) + "...";
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentContainer}>
        <Avatar.Image
          size={36}
          source={{ uri: comment.autorFoto || undefined }}
          style={{ backgroundColor: theme.colors.outline }}
        />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.autorInfo}>
              <Text style={styles.autorNombre} numberOfLines={1}>
                {truncarNombre(comment.autorNombre || "Usuario")}
              </Text>
              <Text style={styles.fecha}>
                {formatearFecha(comment.fechaCreacion)}
              </Text>
            </View>

            {!readOnly && puedeEliminar && (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-horizontal"
                    size={16}
                    onPress={handleMenuPress}
                    style={{ margin: 0 }}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(comment.id);
                  }}
                  title="Eliminar"
                />
              </Menu>
            )}
          </View>

          <Text style={styles.contenido}>{comment.contenido}</Text>

          <View style={styles.actions}>
            {readOnly ? (
              // En modo readOnly, mostrar likes como texto estático
              <View style={styles.staticLikeContainer}>
                <IconButton
                  icon={userLiked ? "heart" : "heart-outline"}
                  size={16}
                  iconColor={
                    userLiked ? theme.colors.error : theme.colors.onSurfaceVariant
                  }
                  style={[styles.likeButton, styles.disabledAction]}
                  onPress={() => {}} // Función vacía para evitar cualquier acción
                />
                <Text style={styles.staticLikeText}>
                  {likeCount <= 0 ? "0" : likeCount}
                </Text>
              </View>
            ) : (
              // Modo normal - botón de like funcional
              <>
                <IconButton
                  icon={userLiked ? "heart" : "heart-outline"}
                  size={16}
                  iconColor={
                    userLiked ? theme.colors.error : theme.colors.onSurfaceVariant
                  }
                  onPress={handleLikeToggle}
                  style={styles.likeButton}
                />
                <Text
                  style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
                >
                  {likeCount}
                </Text>
              </>
            )}

            {!readOnly && nivel < 2 && (
              <IconButton
                icon="reply"
                size={16}
                onPress={handleReplyPress}
                style={styles.replyButton}
              />
            )}
          </View>
        </View>
      </View>

      {/* Respuestas */}
      {comment.respuestas && comment.respuestas.length > 0 && (
        <View style={styles.repliesContainer}>
          {!showReplies ? (
            <Text
              style={styles.viewRepliesText}
              onPress={() => setShowReplies(true)}
            >
              Ver {comment.respuestas.length} respuesta
              {comment.respuestas.length !== 1 ? "s" : ""}
            </Text>
          ) : (
            <>
              {comment.respuestas.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  nivel={nivel + 1}
                  onReply={onReply}
                  onDelete={onDelete}
                  onLikeToggle={onLikeToggle}
                  autorPublicacionUid={autorPublicacionUid}
                  readOnly={readOnly}
                />
              ))}
              <Text
                style={styles.viewRepliesText}
                onPress={() => setShowReplies(false)}
              >
                Ocultar respuestas
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};