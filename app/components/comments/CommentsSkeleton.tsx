
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { useTheme } from 'react-native-paper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6;


const SkeletonElement: React.FC<{
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}> = ({ width = '100%', height = 16, borderRadius = 4, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const theme = useTheme();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};


const CommentSkeletonItem: React.FC<{ hasReply?: boolean }> = ({ hasReply = false }) => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    commentItem: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    commentAuthor: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    commentAuthorInfo: {
      flex: 1,
      marginLeft: 8,
    },
    commentContent: {
      marginBottom: 8,
    },
    commentActions: {
      flexDirection: 'row',
      gap: 12,
    },
  });
  
  return (
    <View style={[
      styles.commentItem, 
      hasReply && { marginLeft: 40, marginTop: 12 }
    ]}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthor}>
          <SkeletonElement width={32} height={32} borderRadius={16} />
          <View style={styles.commentAuthorInfo}>
            <SkeletonElement width="60%" height={16} />
            <SkeletonElement width="40%" height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonElement width={24} height={24} borderRadius={12} />
      </View>
      
      <View style={styles.commentContent}>
        <SkeletonElement height={14} style={{ marginBottom: 4 }} />
        <SkeletonElement width="90%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonElement width="70%" height={14} />
      </View>
      
      <View style={styles.commentActions}>
        <SkeletonElement width={60} height={20} borderRadius={10} />
        <SkeletonElement width={60} height={20} borderRadius={10} />
      </View>
    </View>
  );
};


export const CommentsModalSkeleton: React.FC = () => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: MODAL_HEIGHT,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginVertical: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    content: {
      flex: 1,
    },
    commentsList: {
      flex: 1,
      paddingHorizontal: 16,
    },
    inputContainer: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      marginLeft: 8,
    },
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.overlay} />
      
      <View style={styles.modalContainer}>
        {}
        <View style={[styles.handle, { backgroundColor: theme.colors.surfaceVariant }]} />
        
        {}
        <View style={styles.header}>
          <SkeletonElement width="40%" height={24} borderRadius={6} />
        </View>

        {}
        <View style={styles.content}>
          <ScrollView 
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {}
            <CommentSkeletonItem />
            <CommentSkeletonItem />
            
            {}
            <CommentSkeletonItem />
            <CommentSkeletonItem hasReply={true} />
            <CommentSkeletonItem hasReply={true} />
            
            {}
            <CommentSkeletonItem />
            <CommentSkeletonItem />
          </ScrollView>
        </View>

        {}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <SkeletonElement width={36} height={36} borderRadius={18} />
            <SkeletonElement style={styles.textInput} />
          </View>
        </View>
      </View>
    </View>
  );
};