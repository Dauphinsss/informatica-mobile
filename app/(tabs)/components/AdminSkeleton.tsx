
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}


export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
};


export const StatCardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: 'transparent', shadowColor: 'transparent' }]}>
      <View style={styles.statCardContent}>
        {}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Skeleton width={32} height={32} borderRadius={8} />
        </View>

        {}
        <View style={styles.statContent}>
          <Skeleton width={60} height={36} borderRadius={8} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={20} borderRadius={4} />
        </View>

        {}
        <View style={styles.chevronPosition}>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};


export const ActivityItemSkeleton: React.FC = () => {
  return (
    <View style={styles.activityItem}>
      {}
      <Skeleton width={40} height={40} borderRadius={10} />

      {}
      <View style={styles.activityContent}>
        <Skeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <Skeleton width="50%" height={14} borderRadius={4} />
      </View>

      {}
      <Skeleton width={50} height={14} borderRadius={4} />
    </View>
  );
};


export const ActivitySectionSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.activityCard, { backgroundColor: 'transparent', shadowColor: 'transparent' }]}>
      <View style={{ padding: 16 }}>
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: 16,
    height: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statContent: {
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  chevronPosition: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  activityItem: {
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityCard: {
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
});