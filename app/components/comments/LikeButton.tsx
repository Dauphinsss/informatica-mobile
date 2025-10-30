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
    if (!publicacionId && !comentarioId) return;

    const field = publicacionId ? "publicacionId" : "comentarioId";
    const value = publicacionId || comentarioId;

    const q = query(collection(db, "likes"), where(field, "==", value));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLikesCount(snapshot.size);

      if (auth.currentUser) {
        const userLiked = snapshot.docs.some(
          (doc) => doc.data().autorUid === auth.currentUser?.uid
        );
        setLiked(userLiked);
      }
    });

    return () => unsubscribe();
  }, [publicacionId, comentarioId, auth.currentUser]);

  const handleLike = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await likesService.darLike(
        auth.currentUser.uid,
        publicacionId,
        comentarioId
      );
    } catch (error) {
      console.error("Error al dar like:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        icon={liked ? "heart" : "heart-outline"}
        size={size}
        iconColor={liked ? theme.colors.error : theme.colors.onSurface}
        onPress={handleLike}
        disabled={loading}
      />
      {showCount && likesCount > 0 && (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {likesCount}
        </Text>
      )}
    </>
  );
};
