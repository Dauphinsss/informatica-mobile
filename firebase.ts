import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAB19HjYP4Z_wSYr_b6WextKIpBiW8OLZg",
  authDomain: "mobile-1dae0.firebaseapp.com",
  projectId: "mobile-1dae0",
  storageBucket: "mobile-1dae0.firebasestorage.app",
  messagingSenderId: "262339683739",
  appId: "1:262339683739:web:c6b7628325809b748aad3e",
  measurementId: "G-4652K5EKCR",
};

const app = initializeApp(firebaseConfig);

const { getReactNativePersistence } = require("firebase/auth");

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);