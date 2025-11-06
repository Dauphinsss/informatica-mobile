import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { likesService } from "@/services/likes.service";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { IconButton, Text } from "react-native-paper";

interface LikeButtonProps {
  publicacionId?: string;
  comentarioId?: string;
  initialLikes?: number;
  initialLiked?: boolean;
  size?: number;
  showCount?: boolean;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  publicacionId,
  comentarioId,
  initialLikes = 0,
  initialLiked = false,
  size = 24,
  showCount = true,
}) => {
  const { theme } = useTheme();
  const auth = getAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setLikesCount(initialLikes);
  }, [initialLikes]);

  useEffect(() => {
    if (!publicacionId && !comentarioId) return;

    const field = publicacionId ? "publicacionId" : "comentarioId";
    const value = publicacionId || comentarioId;

    const q = query(collection(db, "likes"), where(field, "==", value));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newCount = snapshot.size;
        setLikesCount(newCount);

        if (auth.currentUser) {
          const userLiked = snapshot.docs.some(
            (doc) => doc.data().autorUid === auth.currentUser?.uid
          );
          setLiked(userLiked);
        }
      },
      (error) => {
        console.error("Error en listener de likes:", error);
      }
    );

    return () => unsubscribe();
  }, [publicacionId, comentarioId, auth.currentUser?.uid]);

  const handleLike = async () => {
    if (!auth.currentUser || loading) return;

    // Optimistic update
    const wasLiked = liked;
    const previousCount = likesCount;

    setLiked(!wasLiked);
    setLikesCount(wasLiked ? previousCount - 1 : previousCount + 1);
    setLoading(true);

    try {
      await likesService.darLike(
        auth.currentUser.uid,
        publicacionId,
        comentarioId
      );
    } catch (error) {
      console.error("Error al dar like:", error);
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikesCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        icon={liked ? "heart" : "heart-outline"}
        size={size}
        iconColor={liked ? theme.colors.primary : theme.colors.onSurfaceVariant}
        onPress={handleLike}
        disabled={loading}
        style={{ margin: 0 }}
      />
      {showCount && (
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            marginLeft: -4,
            fontSize: 12
          }}
        >
          {likesCount}
        </Text>
      )}
    </>
  );
};
