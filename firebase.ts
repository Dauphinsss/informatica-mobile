import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";

// ⚠️ Copia estos valores desde Firebase Console → Configuración del proyecto → SDK Web
const firebaseConfig = {
  apiKey: "AIzaSyAB19HjYP4Z_wSYr_b6WextKIpBiW8OLZg",
  authDomain: "mobile-1dae0.firebaseapp.com",
  projectId: "mobile-1dae0",
  storageBucket: "mobile-1dae0.firebasestorage.app",
  messagingSenderId: "262339683739",
  appId: "1:262339683739:web:c6b7628325809b748aad3e",
  measurementId: "G-4652K5EKCR",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Importa la función de persistencia con require para evitar error de TypeScript
/* eslint-disable */
const { getReactNativePersistence } = require("firebase/auth");
/* eslint-enable */

// Exporta instancia de autenticación con persistencia usando AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
