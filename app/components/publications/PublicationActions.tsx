import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "react-native-paper";
import { LikeButton } from "../comments/LikeButton";

interface PublicationActionsProps {
  publicacionId: string;
  onCommentPress: () => void;
  initialLikes?: number;
  initialLiked?: boolean;
}

export const PublicationActions: React.FC<PublicationActionsProps> = ({
  publicacionId,
  onCommentPress,
  initialLikes = 0,
  initialLiked = false,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Cambiado para separar los elementos
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    leftContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      marginHorizontal: 0, // Eliminamos el margen horizontal original
    },
    likesContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    likesCount: {
      marginLeft: 8,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <LikeButton
          publicacionId={publicacionId}
          initialLikes={initialLikes}
          initialLiked={initialLiked}
          size={28}
          showCount={false}
        />
      </View>

      <IconButton
        icon="comment-outline"
        size={24}
        onPress={onCommentPress}
        style={styles.actionButton}
      />
    </View>
  );
};