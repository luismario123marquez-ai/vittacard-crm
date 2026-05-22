import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Planes from "./pages/Planes";
import Aliados from "./pages/Aliados";
import MapaRedAdmin from "./pages/MapaRedAdmin";
import Transacciones from "./pages/Transacciones";
import VittaData from "./pages/VittaData";
import UsuarioDashboard from "./pages/usuario/UsuarioDashboard";
import AliadoDashboard from "./pages/aliado/AliadoDashboard";

const RutaPrivada = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz pública para la Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Portal del Usuario */}
          <Route path="/usuario/dashboard" element={<RutaPrivada><UsuarioDashboard /></RutaPrivada>} />
          
          {/* Portal del Aliado Comercial */}
          <Route path="/aliado/dashboard" element={<RutaPrivada><AliadoDashboard /></RutaPrivada>} />
          
          {/* Panel CRM del Administrador (Layout pathless) */}
          <Route element={<RutaPrivada><Layout /></RutaPrivada>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/planes" element={<Planes />} />
            <Route path="/aliados" element={<Aliados />} />
            <Route path="/mapa-red" element={<MapaRedAdmin />} />
            <Route path="/transacciones" element={<Transacciones />} />
            <Route path="/vittadata" element={<VittaData />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

