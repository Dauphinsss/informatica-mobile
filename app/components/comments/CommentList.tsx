import { Comment } from "@/app/subjects/types/comment.type";
import { useTheme } from "@/contexts/ThemeContext";
import { comentariosService } from "@/services/comments.service";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Platform, StyleSheet, UIManager, View } from "react-native";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CommentItem } from "./CommentItem";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface CommentListProps {
  publicacionId: string;
  headerComponent?: React.ReactElement;
  footerComponent?: React.ReactElement;
  reloadTrigger?: number | string;
  onCommentsLoaded?: (count: number) => void;
}

export const CommentList: React.FC<CommentListProps> = ({
  publicacionId,
  headerComponent,
  footerComponent,
  reloadTrigger,
  onCommentsLoaded,
}) => {
  const { theme } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRefs = useRef<{ [key: string]: View }>({});

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
      marginBottom: 16,
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    headerContainer: {
      paddingBottom: 16,
    },
    footerContainer: {
      paddingBottom: 16,
    },
  });

  const scrollToInput = useCallback(
    (commentId: string) => {
      setTimeout(() => {
        try {
          if (!flatListRef.current) {
            return;
          }

          let index = comments.findIndex((c) => c.id === commentId);

          if (index === -1) {
            index = comments.findIndex(
              (c) =>
                Array.isArray(c.respuestas) &&
                c.respuestas.some((r) => r.id === commentId)
            );
          }

          if (index >= 0) {
            const baseOffset = 150;
            flatListRef.current.scrollToIndex({
              index,
              animated: true,
              viewOffset: baseOffset,
            });
          } else {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        } catch (error) {
          console.log("Error scrolling to input by index:", error);
          try {
            flatListRef.current?.scrollToEnd({ animated: true });
          } catch {}
        }
      }, 100);
    },
    [comments]
  );

  const registerInputRef = useCallback(
    (commentId: string, ref: View | null) => {
      if (ref) {
        inputRefs.current[commentId] = ref;
      } else {
        delete inputRefs.current[commentId];
      }
    },
    []
  );

  const loadComments = useCallback(async () => {
    if (!publicacionId) {
      setError("ID de publicación no válido");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const comentarios =
        await comentariosService.obtenerComentariosPorPublicacion(
          publicacionId
        );

      setComments(comentarios);

      if (onCommentsLoaded) {
        onCommentsLoaded(comentarios.length);
      }
    } catch (error) {
      console.error("Error cargando comentarios:", error);
      setError("No se pudieron cargar los comentarios. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [publicacionId, onCommentsLoaded]);

  useEffect(() => {
    if (publicacionId) {
      loadComments();
    }
  }, [publicacionId, loadComments]);

  useEffect(() => {
    if (reloadTrigger && publicacionId) {
      loadComments();
    }
  }, [reloadTrigger, publicacionId, loadComments]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadComments();
  };

  const handleCommentAdded = () => {
    loadComments();
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {headerComponent}
      {!loading && !error && comments.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Comentarios ({comments.length})
          </Text>
        </View>
      )}
    </View>
  );

  const ListFooter = () => {
    if (!footerComponent) {
      return null;
    }

    return <View style={styles.footerContainer}>{footerComponent}</View>;
  };

  const EmptyComponent = () => {
    if (loading || error) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge" style={styles.emptyText}>
          Sé el primero en comentar
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.primary,
            marginTop: 8,
            textAlign: "center",
          }}
          onPress={loadComments}
        >
          ¡Comparte tu opinión!
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        {headerComponent}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>
            Cargando comentarios...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        {headerComponent}
        <View style={styles.errorContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            {error}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.primary, textAlign: "center" }}
            onPress={loadComments}
          >
            Tap to reload
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <FlatList
        ref={flatListRef}
        key={`flatlist-${!!footerComponent}`}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const CommentItemAny =
            CommentItem as unknown as React.ComponentType<any>;
          return (
            <CommentItemAny
              comment={item}
              publicacionId={publicacionId}
              onCommentAdded={handleCommentAdded}
              scrollToInput={() => scrollToInput(item.id)}
              registerInputRef={registerInputRef}
            />
          );
        }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ItemSeparatorComponent={() => <Divider />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: footerComponent ? 200 : 200,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        removeClippedSubviews={false}
        maxToRenderPerBatch={15}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListFooterComponentStyle={undefined}
      />
    </SafeAreaView>
  );
};
