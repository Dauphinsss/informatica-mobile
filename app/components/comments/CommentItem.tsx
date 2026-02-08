import { Comment } from "@/app/subjects/types/comment.type";
import { AdminBadge } from "@/components/ui/AdminBadge";
import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import { Avatar, IconButton, Menu, Text, useTheme } from "react-native-paper";
import { LikeButton } from "./LikeButton";

// Habilitar LayoutAnimation en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CommentItemProps {
  comment: Comment;
  nivel?: number;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  autorPublicacionUid?: string;
  readOnly?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  nivel = 0,
  onReply,
  onDelete,
  autorPublicacionUid,
  readOnly = false,
}) => {
  const theme = useTheme();
  const auth = getAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  // Verificar permisos de eliminación
  const puedeEliminar =
    auth.currentUser &&
    (auth.currentUser.uid === comment.autorUid ||
      auth.currentUser.uid === autorPublicacionUid);

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
      alignItems: "flex-start",
      marginBottom: 4,
      gap: 4,
    },
    autorInfo: {
      flexDirection: "column",
      flex: 1,
    },
    autorNombre: {
      fontWeight: "600",
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 18,
    },
    fecha: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      lineHeight: 14,
      marginTop: 2,
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
    repliesContainer: {
      marginTop: 4,
    },
    viewRepliesText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "600",
    },
    repliesWrapper: {
      marginTop: 4,
    },
    hideRepliesText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
    },
  });

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
    return nombre;
  };

  const toggleReplies = () => {
    // Configurar animación suave
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setShowReplies(!showReplies);
  };

  return (
    <View style={styles.container}>
      <View style={styles.commentContainer}>
        <View style={{ position: "relative" }}>
          <Avatar.Image
            size={36}
            source={{ uri: comment.autorFoto || undefined }}
            style={{ backgroundColor: theme.colors.outline }}
          />
          <AdminBadge size={36} isAdmin={comment.autorRol === "admin"} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.autorInfo}>
              <Text style={styles.autorNombre}>
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
            {!readOnly && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: -12,
                }}
              >
                <LikeButton
                  comentarioId={comment.id}
                  initialLikes={comment.likes || 0}
                  size={16}
                  showCount={true}
                />
              </View>
            )}

            {!readOnly && nivel < 2 && (
              <Text
                onPress={handleReplyPress}
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 12,
                  fontWeight: "600",
                  marginLeft: 8,
                }}
              >
                Responder
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Respuestas */}
      {comment.respuestas && comment.respuestas.length > 0 && (
        <View style={styles.repliesContainer}>
          {!showReplies ? (
            <Text style={styles.viewRepliesText} onPress={toggleReplies}>
              ──── Ver {comment.respuestas.length} respuesta
              {comment.respuestas.length !== 1 ? "s" : ""}
            </Text>
          ) : (
            <View>
              <View style={styles.repliesWrapper}>
                {comment.respuestas.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    nivel={nivel + 1}
                    onReply={onReply}
                    onDelete={onDelete}
                    autorPublicacionUid={autorPublicacionUid}
                    readOnly={readOnly}
                  />
                ))}
              </View>
              <Text style={styles.hideRepliesText} onPress={toggleReplies}>
                Ocultar respuestas
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
