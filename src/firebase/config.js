// ============================================
// PASO 1: PEGA AQUÍ TUS CREDENCIALES DE FIREBASE
// Ve a: Firebase Console → Tu proyecto → Configuración → Agrega app web
// ============================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAQMcUXJHMdqvHvW1sGledM9Gg_Q12n6A",
  authDomain: "vittacard-crm.firebaseapp.com",
  projectId: "vittacard-crm",
  storageBucket: "vittacard-crm.firebasestorage.app",
  messagingSenderId: "432418757422",
  appId: "1:432418757422:web:be92599027ae31c6e4b8bf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
