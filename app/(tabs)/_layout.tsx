import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Badge, useTheme } from "react-native-paper";
import { auth, db } from "../../firebase";
import { obtenerContadorNoLeidas } from "../../services/notifications";
import AdminLayOut from "../admin/_layout";

import HomeStack from "./HomeStack";
import NotificationsScreen from "./notifications";
import ProfileScreen from "./profile";

const Tab = createBottomTabNavigator();

type AnimatedTabBarProps = BottomTabBarProps & {
  unreadCount: number;
};

const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  state,
  descriptors,
  navigation,
  insets,
  unreadCount,
}) => {
  const theme = useTheme();
  const animatedValuesRef = useRef<Record<string, Animated.Value>>({});

  // Ensure we have an Animated.Value for each route
  state.routes.forEach((route, index) => {
    if (!animatedValuesRef.current[route.key]) {
      animatedValuesRef.current[route.key] = new Animated.Value(
        state.index === index ? 1 : 0
      );
    }
  });

  // Clean up values when routes change
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

        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const iconElement =
          options.tabBarIcon?.({
            focused,
            color: iconColor,
            size: 24,
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

        const showBadge = route.name === "Notifications" && unreadCount > 0;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
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
                <View>
                  {iconElement}
                  {showBadge && (
                    <Badge style={styles.badge} size={18}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </View>
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

export default function TabLayout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(
            doc(db, "usuarios", auth.currentUser.uid)
          );
          if (userDoc.exists()) {
            setUserRole(userDoc.data().rol);
          }
        } catch (error) {
          console.error("Error al obtener rol:", error);
        }
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  // Listener para contador de no leídas
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = obtenerContadorNoLeidas(
      auth.currentUser.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

  const renderTabBar = (props: BottomTabBarProps) => {
    try {
      const activeRoute = props.state.routes[props.state.index];
      if (
        activeRoute.name === "Admin" &&
        typeof activeRoute.state?.index === "number" &&
        activeRoute.state.index > 0
      ) {
        return null;
      }
      if (
        activeRoute.name === "Home" &&
        activeRoute.state &&
        typeof activeRoute.state.index === "number" &&
        activeRoute.state.index > 0
      ) {
        return null;
      }
    } catch {
      // ignore and fall back to showing tab bar
    }

    return <AnimatedTabBar {...props} unreadCount={unreadCount} />;
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={renderTabBar}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: "Notificaciones",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "bell" : "bell-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminLayOut}
        options={{
          tabBarLabel: "Admin",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "shield-account" : "shield-account-outline"}
              size={26}
              color={color}
            />
          ),
          tabBarButton: userRole === "admin" ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-circle" : "account-circle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
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
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
  },
});
