import { randomBytes } from "crypto";
import { initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore } from "firebase/firestore";

// Configuración de Firebase (sin AsyncStorage para Node.js)
const firebaseConfig = {
  apiKey: "AIzaSyAB19HjYP4Z_wSYr_b6WextKIpBiW8OLZg",
  authDomain: "mobile-1dae0.firebaseapp.com",
  projectId: "mobile-1dae0",
  storageBucket: "mobile-1dae0.firebasestorage.app",
  messagingSenderId: "262339683739",
  appId: "1:262339683739:web:c6b7628325809b748aad3e",
  measurementId: "G-4652K5EKCR",
};

// Inicializar Firebase para Node.js
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCollection = collection(db, 'usuarios');

// Función para generar UID único
const generateUID = (): string => {
  return randomBytes(14).toString('base64').replace(/[+/=]/g, match => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
};

// Lista de usuarios a agregar
const users = [
  {
    correo: "bruno@umss.edu.bo",
    nombre: "Bruno Salcedo",
    rol: "user",
    estado: "activo",
    foto: "https://lh3.googleusercontent.com/a/ACg8oclxNWzOL9S2sL0rd9thQJWng7-MaNekMOUTsNH7I33b7ph5Dn=s96-c",
  },
  {
    correo: "maria@umss.edu.bo",
    nombre: "María González",
    rol: "user",
    estado: "activo",
    foto: "",
  },
  {
    correo: "ramiro@umss.edu.bo",
    nombre: "Ramiro Neruda",
    rol: "user",
    estado: "activo",
    foto: "",
  },
];

const addUsers = async () => {
  console.log(`🚀 Iniciando la carga de ${users.length} usuarios...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      const userData = {
        ...user,
        uid: generateUID(),
        creadoEn: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
      };

      const docRef = await addDoc(usersCollection, userData);
      console.log(`✅ Usuario ${i + 1}/${users.length} agregado:`, {
        nombre: userData.nombre,
        correo: userData.correo,
        uid: userData.uid,
        docId: docRef.id
      });
    } catch (e) {
      console.error(`Error agregando usuario ${user.nombre}:`, e);
    }
  }
  
  console.log("Proceso de carga completado!");
  process.exit(0);
};

addUsers().catch((error) => {
  console.error("Error general en el script:", error);
  process.exit(1);
});