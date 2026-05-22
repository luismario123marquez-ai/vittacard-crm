import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole,    setUserRole]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [theme,       setTheme]       = useState(localStorage.getItem("theme") || "light");

  // Sync theme with body class and localStorage
  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  // ─── Registro: guarda en admins solo si es admin, el resto lo maneja Login.jsx ──
  const register = async (correo, contrasena, nombre, rol = "usuario") => {
    const credencial = await createUserWithEmailAndPassword(auth, correo, contrasena);

    // Solo los admins se guardan en la colección admins
    if (rol === "admin") {
      await setDoc(doc(db, "admins", credencial.user.uid), {
        nombre,
        correo,
        rol: "admin",
        creadoEn: new Date(),
      });
    }

    // Retornar credencial para que Login.jsx guarde usuario/aliado en su colección
    return credencial;
  };

  // ─── Inicio de sesión ──────────────────────────────────────────────────────
  const login = (correo, contrasena) =>
    signInWithEmailAndPassword(auth, correo, contrasena);

  // ─── Cierre de sesión ──────────────────────────────────────────────────────
  const logout = () => signOut(auth);

  // ─── Detectar cambios de sesión ───────────────────────────────────────────
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Verificar si es admin
        const snap = await getDoc(doc(db, "admins", user.uid));
        setUserRole(snap.exists() ? snap.data().rol : "usuario");
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return cancelar;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, register, login, logout, loading, theme, toggleTheme }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
