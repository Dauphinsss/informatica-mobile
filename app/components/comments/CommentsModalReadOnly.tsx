import { Comment } from "@/app/subjects/types/comment.type";
import { comentariosService } from "@/services/comments.service";
import { getAuth } from "firebase/auth";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  ActivityIndicator,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommentItem } from "./CommentItem";

interface CommentsModalReadOnlyProps {
  visible: boolean;
  onDismiss: () => void;
  publicacionId: string;
  autorPublicacionUid?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.85;

export const CommentsModalReadOnly: React.FC<CommentsModalReadOnlyProps> = ({
  visible,
  onDismiss,
  publicacionId,
  autorPublicacionUid,
}) => {
  const theme = useTheme();
  const auth = getAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

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
  });

  
  const handleDisabledAction = () => {
    
  };

  
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
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: (t) => {
            
            return 1 - Math.pow(1 - t, 3);
          },
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
      onDismiss();
    });
  };

  const renderCommentItem = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onReply={handleDisabledAction}
      onDelete={handleDisabledAction}
      autorPublicacionUid={autorPublicacionUid}
      readOnly={true}
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
                    No hay comentarios
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.primary, marginTop: 8 }}
                  >
                    Esta publicación no tiene comentarios
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
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default CommentsModalReadOnly;