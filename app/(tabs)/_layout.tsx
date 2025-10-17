import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, BottomNavigation } from "react-native-paper";
import { auth, db } from "../../firebase";
import { obtenerContadorNoLeidas } from "../../services/notifications";
import AdminLayOut from "../admin/_layout";

import HomeStack from "./HomeStack";
import NotificationsScreen from "./notifications";
import ProfileScreen from "./profile";

const Tab = createBottomTabNavigator();

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

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) =>
        (() => {
          try {
            const activeRoute = state.routes[state.index];
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
            // Si hay un error, mostramos la barra por defecto
          }

          return (
            <BottomNavigation.Bar
              navigationState={state}
              safeAreaInsets={insets}
              onTabPress={({ route, preventDefault }) => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (event.defaultPrevented) {
                  preventDefault();
                } else {
                  navigation.dispatch({
                    ...CommonActions.navigate(route.name, route.params),
                    target: state.key,
                  });
                }
              }}
              renderIcon={({ route, focused, color }) => {
                const { options } = descriptors[route.key];
                if (options.tabBarIcon) {
                  return options.tabBarIcon({ focused, color, size: 24 });
                }
                return null;
              }}
              getLabelText={({ route }) => {
                const { options } = descriptors[route.key];
                const label =
                  options.tabBarLabel !== undefined
                    ? options.tabBarLabel
                    : options.title !== undefined
                    ? options.title
                    : route.name;
                return typeof label === "string" ? label : route.name;
              }}
              style={styles.bottomNavigation}
            />
          );
        })()
      }
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={24}
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
            <View>
              <MaterialCommunityIcons
                name={focused ? "bell" : "bell-outline"}
                size={24}
                color={color}
              />
              {unreadCount > 0 && (
                <Badge
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                  }}
                  size={18}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </View>
          ),
        }}
      />
      {userRole === "admin" && (
        <Tab.Screen
          name="Admin"
          component={AdminLayOut}
          options={{
            tabBarLabel: "Admin",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "shield-account" : "shield-account-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account-circle" : "account-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    elevation: 8,
  },
});
