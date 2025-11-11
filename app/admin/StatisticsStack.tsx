import { StatisticsProvider } from "@/app/admin/contexts/StatisticsContext";
import GeneralScreen from "@/app/admin/screens/GeneralScreen";
import RankingScreen from "@/app/admin/screens/RankingScreen";
import { useTheme } from "@/contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Appbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const AnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
}) => {
  const { theme } = useTheme();
  const animatedValuesRef = useRef<Record<string, Animated.Value>>({});

  state.routes.forEach((route, index) => {
    if (!animatedValuesRef.current[route.key]) {
      animatedValuesRef.current[route.key] = new Animated.Value(
        state.index === index ? 1 : 0
      );
    }
  });

  useEffect(() => {
    const keys = state.routes.map((route) => route.key);
    Object.keys(animatedValuesRef.current).forEach((key) => {
      if (!keys.includes(key)) {
        delete animatedValuesRef.current[key];
      }
    });
  }, [state.routes]);

  useEffect(() => {
    state.routes.forEach((route, index) => {
      Animated.timing(animatedValuesRef.current[route.key], {
        toValue: state.index === index ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, state.routes]);

  const paddingBottom = useMemo(
    () => Math.max(insets.bottom, 12),
    [insets.bottom]
  );

  return (
    <View
      style={[
        styles.customTabBar,
        {
          paddingBottom,
          backgroundColor: theme.colors.elevation.level2,
          borderTopColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const routeOptions = descriptors[route.key].options;

        if (typeof routeOptions.tabBarButton === "function") {
          const buttonComponent = routeOptions.tabBarButton({
            children: null,
          } as any);
          if (buttonComponent === null) {
            return null;
          }
        }

        const focused = state.index === index;
        const animatedValue = animatedValuesRef.current[route.key];
        const scale = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        });
        const labelOpacity = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });
        const backgroundOpacity = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        const backgroundScale = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });
        const iconColor = focused
          ? theme.colors.onPrimaryContainer
          : theme.colors.onSurfaceVariant;
        const labelColor = focused
          ? theme.colors.onSurface
          : theme.colors.onSurfaceVariant;

        const label =
          routeOptions.tabBarLabel !== undefined
            ? routeOptions.tabBarLabel
            : routeOptions.title !== undefined
            ? routeOptions.title
            : route.name;

        const iconElement =
          routeOptions.tabBarIcon?.({
            focused,
            color: iconColor,
            size: 26,
          }) ?? null;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate({
              name: route.name,
              params: route.params,
              merge: true,
            });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={routeOptions.tabBarAccessibilityLabel}
            testID={routeOptions.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View style={styles.iconContainer}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.focusBackground,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    opacity: backgroundOpacity,
                    transform: [{ scale: backgroundScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale }],
                  },
                ]}
              >
                {iconElement}
              </Animated.View>
            </View>
            <Animated.Text
              style={[
                styles.tabLabel,
                {
                  color: labelColor,
                  opacity: labelOpacity,
                },
              ]}
            >
              {typeof label === "string" ? label : route.name}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
};

function StatisticsTabs() {
  const insets = useSafeAreaInsets();

  const renderTabBar = (props: BottomTabBarProps) => {
    return <AnimatedTabBar {...props} insets={insets} />;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={renderTabBar}
    >
      <Tab.Screen
        name="General"
        component={GeneralScreen}
        options={{
          tabBarLabel: "General",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "chart-box" : "chart-box-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          tabBarLabel: "Ranking",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "podium" : "podium"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function StatisticsStack() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <StatisticsProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Appbar.Header
          style={{
            backgroundColor: theme.colors.surface,
          }}
        >
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Estadísticas" />
        </Appbar.Header>
        <StatisticsTabs />
      </View>
    </StatisticsProvider>
  );
}

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 6,
  },
  iconContainer: {
    width: 52,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconWrapper: {
    marginBottom: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  focusBackground: {
    position: "absolute",
    width: 64,
    height: 32,
    borderRadius: 16,
  },
});