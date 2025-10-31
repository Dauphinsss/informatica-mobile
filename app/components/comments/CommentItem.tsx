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
  autorPublicacionUid?: string; // Nueva prop para el UID del autor de la publicación
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  publicacionId,
  onCommentAdded,
  nivel = 0,
  scrollToInput,
  registerInputRef,
  autorPublicacionUid, // Recibir el UID del autor de la publicación
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

  const truncarNombre = (nombreCompleto: string): string => {
    if (!nombreCompleto) return "Usuario";
    
    if (nombreCompleto.length <= 20) return nombreCompleto;
    
    const partes = nombreCompleto.trim().split(/\s+/);
    
    if (partes.length === 1) {
      return nombreCompleto.length > 20 
        ? nombreCompleto.substring(0, 17) + '...' 
        : nombreCompleto;
    }
    
    const nombre = partes[0];
    const primerApellido = partes[1];
    
    const nombreCorto = `${nombre} ${primerApellido}`;
    if (nombreCorto.length <= 20) return nombreCorto;
    
    if (nombre.length <= 20) return nombre;
    
    return nombre.length > 20 
      ? nombre.substring(0, 17) + '...' 
      : nombre;
  };

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
    headerCompact: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 4,
    },
    autorYFecha: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      flexWrap: "wrap",
      marginRight: 8,
    },
    autorNombre: {
      fontWeight: "bold",
      color: theme.colors.onSurface,
      maxWidth: "70%",
    },
    fecha: {
      color: theme.colors.onSurfaceVariant,
      marginLeft: 8,
      fontSize: 12,
      flexShrink: 0,
    },
    menuContainer: {
      marginLeft: "auto",
      flexShrink: 0,
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
      width: 24,
      height: 24,
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

  // Lógica mejorada: puede eliminar si es el autor del comentario O si es el autor de la publicación
  const puedeEliminar = auth.currentUser && (
    auth.currentUser.uid === comment.autorUid || 
    auth.currentUser.uid === autorPublicacionUid
  );

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

  const nombreMostrado = truncarNombre(comment.autorNombre || "Usuario");

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
          <View style={styles.headerCompact}>
            <View style={styles.autorYFecha}>
              <Text
                variant="bodyMedium"
                style={styles.autorNombre}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {nombreMostrado}
              </Text>
              <Text
                variant="bodySmall"
                style={styles.fecha}
                numberOfLines={1}
              >
                {formatearFecha(comment.fechaCreacion)}
              </Text>
            </View>
            
            {puedeEliminar && (
              <View style={styles.menuContainer}>
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
              </View>
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
                showCancelButton={true}
              />
            </View>
          )}
        </View>
      </View>

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
                autorPublicacionUid={autorPublicacionUid} // Pasar la prop a las respuestas
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