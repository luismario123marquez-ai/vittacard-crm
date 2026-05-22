import React, { useEffect, useState } from "react";
import { renderToString } from "react-dom/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Error Boundary para capturar y mostrar errores de Leaflet en pantalla
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "24px", 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.2)", 
          borderRadius: "16px", 
          color: "#F87171",
          fontFamily: "monospace",
          fontSize: "13px",
          overflow: "auto",
          height: "100%",
          minHeight: "400px"
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#EF4444", fontSize: "16px", fontWeight: "bold" }}>
            ❌ Error de Renderizado en el Mapa Real
          </h3>
          <p style={{ fontWeight: "bold", margin: "0 0 8px 0" }}>{this.state.error?.message}</p>
          <pre style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}


// Colores de categorías (Hex y Tailwind)
const sectorColorsHex = {
  Salud: "#00B4B4",
  Deporte: "#3B82F6",
  Supermercado: "#F97316",
  Restaurante: "#F97316",
  Farmacia: "#10B981",
  Entretenimiento: "#7C3AED",
  Otro: "#6B7280"
};

// Estilo de badges en lista
const getCategoriaBadgeStyle = (sector) => {
  switch ((sector || "").toLowerCase()) {
    case "salud": return { bg: "rgba(0, 180, 180, 0.15)", text: "#00B4B4" };
    case "deporte": return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" };
    case "supermercado": return { bg: "rgba(249, 115, 22, 0.15)", text: "#F97316" };
    case "restaurante": return { bg: "rgba(249, 115, 22, 0.15)", text: "#F97316" };
    case "farmacia": return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" };
    case "entretenimiento": return { bg: "rgba(124, 58, 237, 0.15)", text: "#9061F9" };
    default: return { bg: "rgba(107, 114, 128, 0.15)", text: "#9CA3AF" };
  }
};

// SVG Icons para las categorías
const getIconSvg = (sector) => {
  const s = (sector || "").toLowerCase();
  if (s === "salud") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
  }
  if (s === "deporte") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="M14 21l7-7"/></svg>`;
  }
  if (s === "supermercado") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`;
  }
  if (s === "restaurante") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
  }
  if (s === "farmacia") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect width="20" height="12" x="2" y="10" rx="2"/><path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><path d="M12 18h.01"/></svg>`;
};

// Componente de React para el Pin Personalizado (se renderiza a HTML vía renderToString)
const CustomPin = ({ color, name, discount, esAliadoPropio, sector }) => {
  const borderStyle = esAliadoPropio 
    ? "border-2 border-yellow-400 scale-110 shadow-[0_0_12px_rgba(234,179,8,0.6)]" 
    : "border border-white/20";
  
  const pulseHtml = esAliadoPropio 
    ? <div className="absolute -inset-1.5 rounded-full border-2 border-yellow-400 animate-ping opacity-75"></div>
    : null;
    
  const crownHtml = esAliadoPropio 
    ? <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[14px] animate-bounce">👑</div>
    : null;

  return (
    <div className="relative flex flex-col items-center" style={{ transform: "translate(0, -16px)" }}>
      {crownHtml}
      {pulseHtml}
      {/* Teardrop Pin */}
      <div 
        className={`w-8 h-8 rounded-full rounded-br-none rotate-45 flex items-center justify-center shadow-lg ${borderStyle} transition-transform duration-300 hover:scale-110`} 
        style={{ backgroundColor: color }}
      >
        {/* Rotate back by -45deg to keep icon upright */}
        <div 
          className="-rotate-45 flex items-center justify-center text-white w-4 h-4"
          dangerouslySetInnerHTML={{ __html: getIconSvg(sector) }}
        />
      </div>
      {/* Permanent Floating Label */}
      <div className="absolute top-9 bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md border border-slate-700/50 whitespace-nowrap backdrop-blur-sm flex flex-col items-center min-w-[70px] max-w-[120px]">
        <span className="text-slate-200 truncate w-full text-center">{name}</span>
        <span className="text-teal-400 font-extrabold text-[9px]">{discount}</span>
      </div>
    </div>
  );
};

// Coordenadas reales aproximadas de Popayán
const getCoordenadas = (aliado) => {
  if (!aliado) return [2.4448, -76.6147];
  
  // Soporte para coordenadas almacenadas en Firebase
  if (aliado.coordenadas && Array.isArray(aliado.coordenadas) && aliado.coordenadas.length === 2) {
    const lat = parseFloat(aliado.coordenadas[0]);
    const lng = parseFloat(aliado.coordenadas[1]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (typeof aliado.lat === "number" && typeof aliado.lng === "number") {
    if (!isNaN(aliado.lat) && !isNaN(aliado.lng)) return [aliado.lat, aliado.lng];
  }
  if (aliado.latitude && aliado.longitude) {
    const lat = parseFloat(aliado.latitude);
    const lng = parseFloat(aliado.longitude);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  const name = (aliado.nombre || "").toLowerCase();
  const address = (aliado.ubicacion || "").toLowerCase();

  if (name.includes("salud vida") || name.includes("saludvida")) {
    return [2.4705, -76.5935];
  }
  if (name.includes("nicki") || name.includes("burger") || name.includes("burguer")) {
    if (address.includes("catay") || name.includes("catay")) {
      return [2.4590, -76.5975];
    }
    return [2.4415, -76.6090];
  }
  if (name.includes("smartfit") || name.includes("smart fit")) {
    return [2.4560, -76.5995];
  }
  if (name.includes("merca fruver") || name.includes("fruver") || name.includes("la 13") || name.includes("la13")) {
    return [2.4410, -76.6130];
  }
  if (name.includes("medical")) {
    return [2.4435, -76.6080];
  }
  if (name.includes("estancia")) {
    return [2.4595, -76.5980];
  }
  if (name.includes("san josé") || name.includes("san jose")) {
    return [2.4530, -76.6025];
  }
  if (name.includes("farmatodo")) {
    return [2.4635, -76.5960];
  }
  if (name.includes("villas")) {
    return [2.4580, -76.5975];
  }
  if (name.includes("mora castilla")) {
    return [2.4422, -76.6062];
  }

  // Hash determinista en Popayán
  let hash = 0;
  const str = aliado.id || aliado.nombre || "mapPoint";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latMin = 2.4350, latMax = 2.4700;
  const lngMin = -76.6250, lngMax = -76.5950;
  
  const lat = latMin + Math.abs((hash >> 3) % 1000) / 1000 * (latMax - latMin);
  const lng = lngMin + Math.abs((hash >> 7) % 1000) / 1000 * (lngMax - lngMin);
  return [lat, lng];
};

// Componente Controlador de la Vista del Mapa
function MapController({ selectedAliado }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedAliado) {
      const coords = getCoordenadas(selectedAliado);
      map.setView(coords, 16, { animate: true });
    }
  }, [selectedAliado, map]);

  return (
    <div style={{
      position: "absolute",
      top: "16px",
      left: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      zIndex: 1000
    }}>
      <button 
        onClick={() => map.zoomIn()} 
        title="Acercar" 
        style={{ width: "34px", height: "34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.85)", color: "#fff", fontSize: "18px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      >
        +
      </button>
      <button 
        onClick={() => map.zoomOut()} 
        title="Alejar" 
        style={{ width: "34px", height: "34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.85)", color: "#fff", fontSize: "18px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      >
        -
      </button>
      <button 
        onClick={() => map.setView([2.4448, -76.6147], 14)} 
        title="Restablecer" 
        style={{ width: "34px", height: "34px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(15, 23, 42, 0.85)", color: "#fff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
      >
        ⟲
      </button>
    </div>
  );
}

function MapaAliadosInner({ rol, userPlan = "essential", currentAlly = null }) {
  const { theme } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === "dark";

  const [aliados, setAliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAliado, setSelectedAliado] = useState(null);
  
  // Filtros
  const [selectedSector, setSelectedSector] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar Aliados
  useEffect(() => {
    const fetchAliados = async () => {
      try {
        const snap = await getDocs(collection(db, "aliados"));
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAliados(lista);
      } catch (err) {
        console.error("Error cargando aliados para el mapa:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAliados();
  }, []);

  // Calcular descuento dinámico según el plan del usuario
  const calcularDescuento = (sector) => {
    const plan = (userPlan || "essential").toLowerCase();
    const sec = (sector || "Otro").toLowerCase();
    if (plan === "platinum") {
      return sec === "salud" ? "20%" : "15%";
    } else if (plan === "lifestyle") {
      return (sec === "salud" || sec === "deporte") ? "10%" : "8%";
    } else {
      return "5%";
    }
  };

  // Crear pin personalizado
  const createCustomPin = (aliado) => {
    if (!aliado) return null;
    const color = sectorColorsHex[aliado.sector] || "#6B7280";
    const name = aliado.nombre || "";
    const discount = `${calcularDescuento(aliado.sector)} OFF`;
    
    const esAliadoPropio = rol === "aliado" && currentAlly && 
                          (aliado.id === currentAlly.id || aliado.correo === currentAlly.correo);

    const html = renderToString(
      <CustomPin 
        color={color} 
        name={name} 
        discount={discount} 
        esAliadoPropio={esAliadoPropio} 
        sector={aliado.sector} 
      />
    );

    if (L && typeof L.divIcon === "function") {
      return L.divIcon({
        className: "custom-leaflet-pin",
        html: html,
        iconSize: [120, 60],
        iconAnchor: [60, 16]
      });
    }
    return null;
  };

  // Centrar mapa en un aliado específico
  const centrarEnAliado = (aliado) => {
    setSelectedAliado(aliado);
  };

  // Filtrado de aliados
  const aliadosFiltrados = aliados.filter(a => {
    const cumpleEstado = rol === "admin" ? true : a.activo === true;
    const cumpleSector = selectedSector === "Todos" || a.sector === selectedSector;
    const cumpleBusqueda = (a.nombre || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (a.ubicacion || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (a.sector || "").toLowerCase().includes(searchQuery.toLowerCase());
    return cumpleEstado && cumpleSector && cumpleBusqueda;
  });

  const aliadosMismaCategoria = aliados.filter(a => {
    return a.activo && 
           a.sector === currentAlly?.sector && 
           a.id !== currentAlly?.id;
  });

  const colors = {
    bg: isDark ? "#090D16" : "#F8FAFC",
    sidebarBg: isDark ? "#1E293B" : "#FFFFFF",
    border: isDark ? "#334155" : "#E2E8F0",
    text: isDark ? "#F8FAFC" : "#1E293B",
    textMuted: isDark ? "#94A3B8" : "#64748B",
  };

  const categories = ["Todos", "Salud", "Deporte", "Supermercado", "Restaurante", "Farmacia", "Entretenimiento", "Otro"];

  return (
    <div style={{ 
      display: "flex", 
      gap: "24px", 
      fontFamily: "'Inter', sans-serif",
      color: colors.text,
      minHeight: "560px",
      height: "calc(100vh - 180px)",
      flexDirection: "row"
    }}>
      {/* Estilos CSS Globales del Leaflet Overrides */}
      <style>{`
        .custom-leaflet-pin {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Override Leaflet Popup styles to fit premium glassmorphism dark theme */
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4) !important;
          padding: 4px !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-popup-close-button {
          color: #94a3b8 !important;
          font-size: 16px !important;
          top: 8px !important;
          right: 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }
        .leaflet-popup-content {
          margin: 8px 12px !important;
          line-height: 1.4 !important;
        }
      `}</style>

      {/* PANEL LATERAL DE CONTROL */}
      <aside style={{
        width: "320px",
        background: colors.sidebarBg,
        border: `1px solid ${colors.border}`,
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        zIndex: 5
      }}>
        {/* BUSCADOR */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${colors.border}` }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontFamily: "Syne", fontWeight: 800 }}>
            {rol === "usuario" && "🔎 Filtros y Comercios"}
            {rol === "aliado" && "🏬 Tu Red & Competencia"}
            {rol === "admin" && "🛠️ Control de la Red"}
          </h3>
          <input
            type="text"
            placeholder="🔍 Buscar comercio o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${colors.border}`,
              background: isDark ? "#0F172A" : "#F1F5F9",
              color: colors.text,
              fontSize: "13px",
              outline: "none"
            }}
          />
        </div>

        {/* CONTENIDO DEL SIDEBAR */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          
          {/* ROL: USUARIO */}
          {rol === "usuario" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 600, display: "block", marginBottom: "8px" }}>SECTOR</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedSector(cat)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: selectedSector === cat ? "#00B4B4" : (isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9"),
                        color: selectedSector === cat ? "#fff" : colors.text,
                        transition: "all 0.15s"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "14px" }}>
                <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 600, display: "block", marginBottom: "10px" }}>
                  COMERCIOS DISPONIBLES ({aliadosFiltrados.length})
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {aliadosFiltrados.map(a => {
                    const badge = getCategoriaBadgeStyle(a.sector);
                    const dcto = calcularDescuento(a.sector);
                    return (
                      <div
                        key={a.id}
                        onClick={() => centrarEnAliado(a)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: `1px solid ${selectedAliado?.id === a.id ? "#00B4B4" : colors.border}`,
                          background: selectedAliado?.id === a.id ? (isDark ? "rgba(0,180,180,0.1)" : "#E0F7F7") : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "13.5px", fontWeight: 700 }}>{a.nombre}</h4>
                          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#10B981" }}>{dcto} DTO</span>
                        </div>
                        <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: colors.textMuted }}>📍 {a.ubicacion}</p>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "9px",
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.text
                        }}>{a.sector}</span>
                      </div>
                    );
                  })}
                  {aliadosFiltrados.length === 0 && (
                    <p style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center", padding: "16px" }}>No se encontraron aliados activos.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROL: ALIADO */}
          {rol === "aliado" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {currentAlly && (
                <div style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: isDark ? "rgba(0,180,180,0.1)" : "#E0F7F7",
                  border: "1px solid #00B4B4",
                  marginBottom: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "16px" }}>👑</span>
                    <strong style={{ fontSize: "13.5px", color: "#00B4B4" }}>Ubicación Confirmada</strong>
                  </div>
                  <h4 style={{ margin: "2px 0 4px 0", fontSize: "14px", fontWeight: 800 }}>{currentAlly.nombre}</h4>
                  <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: colors.textMuted }}>📍 {currentAlly.ubicacion}</p>
                  <button
                    onClick={() => centrarEnAliado(currentAlly)}
                    style={{
                      background: "#00B4B4",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    Ver en el mapa 🎯
                  </button>
                </div>
              )}

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: "14px" }}>
                <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 600, display: "block", marginBottom: "10px" }}>
                  COMERCIOS DE TU SECTOR ({currentAlly?.sector})
                </span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {aliadosMismaCategoria.map(a => {
                    const badge = getCategoriaBadgeStyle(a.sector);
                    return (
                      <div
                        key={a.id}
                        onClick={() => centrarEnAliado(a)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          border: `1px solid ${selectedAliado?.id === a.id ? "#00B4B4" : colors.border}`,
                          background: selectedAliado?.id === a.id ? (isDark ? "rgba(0,180,180,0.06)" : "#F1F5F9") : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 700 }}>{a.nombre}</h4>
                        <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: colors.textMuted }}>📍 {a.ubicacion}</p>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "9px",
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.text
                        }}>{a.sector}</span>
                      </div>
                    );
                  })}
                  {aliadosMismaCategoria.length === 0 && (
                    <p style={{ fontSize: "12px", color: colors.textMuted, textAlign: "center", padding: "16px" }}>No hay otros comercios en tu misma categoría.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROL: ADMINISTRADOR */}
          {rol === "admin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: colors.textMuted, fontWeight: 600, display: "block", marginBottom: "4px" }}>
                REGISTROS CRM ({aliadosFiltrados.length})
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {aliadosFiltrados.map(a => {
                  const badge = getCategoriaBadgeStyle(a.sector);
                  return (
                    <div
                      key={a.id}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: `1px solid ${selectedAliado?.id === a.id ? "#00B4B4" : colors.border}`,
                        background: selectedAliado?.id === a.id ? (isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC") : "transparent",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "12px",
                          fontSize: "9px",
                          fontWeight: 700,
                          background: a.activo ? "#D1FAE5" : "#FEE2E2",
                          color: a.activo ? "#059669" : "#DC2626"
                        }}>
                          {a.activo ? "Activo" : "Inactivo"}
                        </span>
                        
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "9px",
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.text
                        }}>{a.sector}</span>
                      </div>

                      <h4 
                        onClick={() => centrarEnAliado(a)} 
                        style={{ margin: "2px 0", fontSize: "13px", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                      >
                        {a.nombre}
                      </h4>
                      <p style={{ margin: 0, fontSize: "11px", color: colors.textMuted }}>📍 {a.ubicacion}</p>
                      
                      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                        <button
                          onClick={() => centrarEnAliado(a)}
                          style={{
                            flex: 1,
                            padding: "4px 8px",
                            fontSize: "10px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: `1px solid ${colors.border}`,
                            background: isDark ? "#334155" : "#E2E8F0",
                            color: colors.text,
                            cursor: "pointer"
                          }}
                        >
                          🗺️ Centrar
                        </button>
                        <button
                          onClick={() => navigate("/aliados", { state: { editId: a.id } })}
                          style={{
                            flex: 1,
                            padding: "4px 8px",
                            fontSize: "10px",
                            fontWeight: 600,
                            borderRadius: "6px",
                            border: "none",
                            background: "#00B4B4",
                            color: "white",
                            cursor: "pointer"
                          }}
                        >
                          ⚙️ Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* CONTENEDOR DEL MAPA REAL LEAFLET */}
      <div 
        style={{
          flex: 1,
          border: `1.5px solid ${isDark ? "#334155" : "#CBD5E1"}`,
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
          background: colors.bg,
          boxShadow: isDark ? "inset 0 4px 20px rgba(0,0,0,0.4)" : "inset 0 2px 10px rgba(0,0,0,0.05)"
        }}
      >
        {/* BOTÓN ABRIR EN MAPS */}
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000
        }}>
          <a
            href={
              selectedAliado
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedAliado.nombre}, ${selectedAliado.ubicacion || ""}, Popayán`
                  )}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Popayán, Cauca, Colombia")}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1.5px solid #00B4B4",
              background: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.9)",
              color: "#00B4B4",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s"
            }}
            className="hover:bg-cyan-500/10 active:bg-cyan-500/20"
          >
            <MapPin size={14} />
            <span>Abrir en Maps</span>
          </a>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
            <p style={{ color: colors.textMuted }}>Cargando mapa real...</p>
          </div>
        ) : (
          <MapContainer
            key={`${isDark ? 'dark' : 'light'}-${rol}`}
            center={[2.4448, -76.6147]}
            zoom={14}
            zoomControl={false}
            style={{ width: "100%", height: "100%", zIndex: 1 }}
          >
            <MapController selectedAliado={selectedAliado} />
            
            <TileLayer
              url={isDark 
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Marcadores de los aliados con sus Popups anidados */}
            {aliadosFiltrados.map(a => {
              const coords = getCoordenadas(a);
              const isSelected = selectedAliado?.id === a.id;
              const badge = getCategoriaBadgeStyle(a.sector);
              return (
                <Marker
                  key={a.id}
                  position={coords}
                  icon={createCustomPin(a)}
                  eventHandlers={{
                    click: () => {
                      setSelectedAliado(a);
                    }
                  }}
                >
                  {isSelected && (
                    <Popup onClose={() => setSelectedAliado(null)}>
                      <div style={{ padding: "4px", minWidth: "220px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.text
                          }}>
                            {a.sector}
                          </span>
                        </div>
                        
                        <h4 style={{ margin: "4px 0 2px 0", fontSize: "14px", fontWeight: 800, color: "#fff" }}>{a.nombre}</h4>
                        <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#94A3B8" }}>NIT: {a.nit}</p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", marginBottom: "8px", color: "#E2E8F0" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "start" }}>
                            <span>📍</span>
                            <span>{a.ubicacion}</span>
                          </div>
                          {a.telefono && (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <span>📞</span>
                              <span>{a.telefono}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                          {rol === "usuario" && (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "#94A3B8" }}>Tu Plan ({userPlan.toUpperCase()}):</span>
                                <span style={{ fontSize: "14px", fontWeight: 800, color: "#10B981" }}>
                                  {calcularDescuento(a.sector)} DTO
                                </span>
                              </div>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.nombre}, ${a.ubicacion || ""}, Popayán`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "block",
                                  textAlign: "center",
                                  background: "rgba(0, 180, 180, 0.2)",
                                  color: "#00B4B4",
                                  border: "1px solid rgba(0, 180, 180, 0.3)",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  fontWeight: "bold",
                                  textDecoration: "none",
                                  marginTop: "8px",
                                  transition: "all 0.2s"
                                }}
                              >
                                Ver Detalles & Cómo llegar 🚗
                              </a>
                            </div>
                          )}

                          {rol === "aliado" && (
                            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                              {currentAlly?.id === a.id ? (
                                <div style={{ textAlign: "center", fontWeight: 700, color: "#F59E0B" }}>
                                  ✨ ¡Tu ubicación oficial!
                                </div>
                              ) : (
                                <div>Descuentos otorgados: <strong>5% / 8% / 15%</strong></div>
                              )}
                            </div>
                          )}

                          {rol === "admin" && (
                            <button
                              onClick={() => navigate("/aliados", { state: { editId: a.id } })}
                              style={{
                                width: "100%",
                                padding: "6px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#00B4B4",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "11px",
                                cursor: "pointer"
                              }}
                            >
                              Gestionar Aliado 🛠️
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default function MapaAliados(props) {
  return (
    <ErrorBoundary>
      <MapaAliadosInner {...props} />
    </ErrorBoundary>
  );
}
