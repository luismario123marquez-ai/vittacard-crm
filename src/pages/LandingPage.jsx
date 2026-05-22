import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { Check } from "lucide-react";


const DEFAULT_PLANES = [
  {
    id: "free",
    nombre: "Free",
    subtitulo: "Básico",
    cuota: 0,
    beneficios: [
      "Tarjeta Digital inmediata",
      "Acceso básico al mapa de aliados",
      "Soporte estándar por correo",
      "Sin cuota mensual (Totalmente Gratis)",
    ],
    color: "#64748B",
  },
  {
    id: "basico",
    nombre: "Básico",
    subtitulo: "Esencial",
    cuota: 4900,
    beneficios: [
      "Descuento del 5% en comercios",
      "Tarjeta Física Estándar gratis",
      "Acceso completo al mapa de aliados",
      "Soporte prioritario por WhatsApp",
    ],
    color: "#3B82F6",
  },
  {
    id: "plus",
    nombre: "Plus",
    subtitulo: "Avanzado",
    cuota: 12900,
    beneficios: [
      "Descuento del 10% en comercios",
      "Tarjeta Física Personalizada",
      "Prioridad y Soporte 24/7",
      "Preventas y ofertas especiales",
    ],
    color: "#14B8A6",
  },
  {
    id: "premium",
    nombre: "Premium",
    subtitulo: "Recomendado",
    cuota: 24900,
    beneficios: [
      "Descuento del 15% en comercios",
      "Tarjeta Metálica Black exclusiva",
      "1% de Cashback acumulable",
      "Salas VIP y eventos exclusivos",
    ],
    color: "#7C3AED",
  },
];

const INTEGRANTES = [
  { nombre: "Juan Esteban Salamanca Vanegas",   rol: "Desarrollador · Ingeniería de Software" },
  { nombre: "Luis Mario Marquez Esterilla",      rol: "Desarrollador · Ingeniería de Software" },
  { nombre: "Cristian Fernando Alzate Calvache", rol: "Desarrollador · Ingeniería de Software" },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [modalEquipo, setModalEquipo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para formulario de contacto
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  
  // Estado para planes de Firestore
  const [planes, setPlanes] = useState(DEFAULT_PLANES);

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const pSnap = await getDocs(collection(db, "planes"));
        if (!pSnap.empty) {
          const planOrder = ["free", "basico", "plus", "premium"];
          const dbPlanes = pSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
          setPlanes(dbPlanes);
        }
      } catch (error) {
        console.error("Error cargando planes de Firestore:", error);
      }
    };
    fetchPlanes();
  }, []);

  const modoOscuro = theme === "dark";

  // Efecto para cerrar menú móvil si se cambia tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Efecto para Scroll Reveal (revelar tarjetas y elementos con el scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleContactoSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !correo || !mensaje) return;
    setEnviado(true);
    setTimeout(() => {
      setNombre("");
      setCorreo("");
      setMensaje("");
      setEnviado(false);
      alert("¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas.");
    }, 1000);
  };

  // Función para redirigir al login/registro preconfigurando los parámetros
  const irALogin = (esReg, rolSel) => {
    navigate("/login", { state: { esRegistro: esReg, rol: rolSel } });
  };

  // Fondos y degradados adaptativos
  const bgTheme = modoOscuro 
    ? "radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.15) 0%, rgba(6, 182, 212, 0.05) 45%, rgba(3, 19, 28, 0) 100%), linear-gradient(135deg, #020c12 0%, #041925 50%, #01080d 100%)"
    : "radial-gradient(circle at 80% 20%, rgba(20, 184, 166, 0.08) 0%, rgba(148, 163, 184, 0) 100%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)";

  // Configuración de colores del sistema adaptativo
  const c = {
    texto: modoOscuro ? "rgba(255, 255, 255, 0.95)" : "#0f172a",
    textoSub: modoOscuro ? "rgba(255, 255, 255, 0.6)" : "#475569",
    cardBg: modoOscuro ? "rgba(10, 25, 35, 0.65)" : "rgba(255, 255, 255, 0.85)",
    cardBorde: modoOscuro ? "rgba(20, 184, 166, 0.15)" : "rgba(226, 232, 240, 0.8)",
    shadow: modoOscuro ? "0 8px 32px 0 rgba(0, 0, 0, 0.3)" : "0 8px 32px 0 rgba(148, 163, 184, 0.06)",
    
    // Iconos / Accents
    redBg: modoOscuro ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.06)",
    redBorde: modoOscuro ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.15)",
    redText: modoOscuro ? "#f87171" : "#dc2626",

    tealBg: modoOscuro ? "rgba(20, 184, 166, 0.1)" : "rgba(20, 184, 166, 0.06)",
    tealBorde: modoOscuro ? "rgba(20, 184, 166, 0.25)" : "rgba(20, 184, 166, 0.15)",
    tealText: modoOscuro ? "#2dd4bf" : "#0d9488",

    indigoBg: modoOscuro ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.06)",
    indigoBorde: modoOscuro ? "rgba(99, 102, 241, 0.25)" : "rgba(99, 102, 241, 0.15)",
    indigoText: modoOscuro ? "#818cf8" : "#4f46e5",

    blueBg: modoOscuro ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.06)",
    blueBorde: modoOscuro ? "rgba(59, 130, 246, 0.25)" : "rgba(59, 130, 246, 0.15)",
    blueText: modoOscuro ? "#60a5fa" : "#2563eb",

    // Botones y Formularios
    btnGhostBg: modoOscuro ? "transparent" : "transparent",
    btnGhostBorder: modoOscuro ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
    inputBg: modoOscuro ? "rgba(2, 12, 18, 0.6)" : "#ffffff",
    inputBorde: modoOscuro ? "rgba(20, 184, 166, 0.25)" : "rgba(226, 232, 240, 1)",
    inputFocus: modoOscuro ? "#2dd4bf" : "#0d9488",
  };

  const s = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      background: modoOscuro ? "rgba(3, 19, 28, 0.75)" : "rgba(255, 255, 255, 0.75)",
      borderBottom: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
      transition: "all 0.3s ease",
    },
    headerContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
      fontSize: "20px",
      fontWeight: 800,
      fontFamily: "Syne, sans-serif",
      letterSpacing: "-0.5px",
    },
    navLink: {
      fontSize: "12px",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "1px",
      textDecoration: "none",
      color: modoOscuro ? "rgba(255, 255, 255, 0.7)" : "#475569",
      transition: "color 0.2s ease",
      cursor: "pointer",
      background: "none",
      border: "none",
      whiteSpace: "nowrap",
    },
    btnGhost: {
      fontSize: "12px",
      fontWeight: 700,
      background: "transparent",
      border: modoOscuro ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "10px",
      padding: "10px 20px",
      color: modoOscuro ? "#fff" : "#1e293b",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    btnPrimary: {
      fontSize: "12px",
      fontWeight: 700,
      background: "#00B4B4",
      border: "none",
      borderRadius: "10px",
      padding: "10px 20px",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 4px 14px 0 rgba(0, 180, 180, 0.3)",
    },
  };

  const estiloCard = {
    background: c.cardBg,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${c.cardBorde}`,
    borderRadius: "16px",
    padding: "32px",
    boxShadow: c.shadow,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    color: c.texto,
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  };

  const estiloLabelSeccion = (colorBg, colorText, colorBorde) => ({
    display: "inline-block",
    padding: "5px 12px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    borderRadius: "20px",
    background: colorBg,
    color: colorText,
    border: `1px solid ${colorBorde}`,
    marginBottom: "16px",
    textTransform: "uppercase",
    width: "fit-content",
  });

  return (
    <div 
      style={{ 
        background: bgTheme,
        minHeight: "100vh",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        transition: "background 0.3s ease, color 0.3s ease",
        color: c.texto,
        overflowX: "hidden",
      }}
    >
      {/* Estilos CSS Inyectados para Grids Responsivos, Keyframes, Scroll Reveal y Efectos Hover */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Grids adaptativos */
        .grid-hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 48px;
          align-items: center;
        }
        .grid-3-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .grid-4-col {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .grid-2-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        /* Contenedores de sección responsivos */
        .section-container {
          padding: 120px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Rejilla de información de contacto */
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          height: fit-content;
        }

        /* Contenedor del footer responsivo */
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .grid-hero {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .hero-text-col {
            align-items: center !important;
            text-align: center !important;
          }
          .grid-3-col, .grid-4-col {
            grid-template-columns: 1fr;
          }
          .section-container {
            padding: 80px 20px;
          }
        }

        @media (max-width: 768px) {
          .grid-2-col {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .section-container {
            padding: 60px 16px;
          }
          .footer-container {
            flex-direction: column !important;
            text-align: center !important;
            justify-content: center !important;
            gap: 16px !important;
          }
        }

        @media (max-width: 640px) {
          .contact-info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        /* Animaciones iniciales (Fade In Up) */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-1 { animation-delay: 0.15s; }
        .delay-2 { animation-delay: 0.3s; }
        .delay-3 { animation-delay: 0.45s; }

        /* Efectos Hover premium para tarjetas y botones */
        .hover-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 20px 40px rgba(0, 180, 180, 0.15) !important;
          border-color: rgba(6, 182, 212, 0.3) !important;
        }
        
        .hover-card-red:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.12) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
        }

        .hover-card-lifestyle:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 25px 50px rgba(99, 102, 241, 0.35) !important;
        }

        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 180, 180, 0.3) !important;
          filter: brightness(1.1);
        }
        
        .btn-hover-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.15) !important;
          background-color: #f8fafc !important;
        }

        .btn-hover-ghost:hover {
          background-color: ${modoOscuro ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"} !important;
          border-color: ${modoOscuro ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.25)"} !important;
        }

        /* Scroll Reveal clases */
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .reveal.revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* Efectos de luces en la tarjeta de crédito */
        .credit-card-glow::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 80%);
          transform: rotate(30deg);
          transition: 0.5s;
          pointer-events: none;
        }
        .credit-card-glow:hover::before {
          left: -30%;
          top: -30%;
        }
      `}} />

      {/* ════════════════════════════════════════════════════════════════════
          1. BARRA DE NAVEGACIÓN (HEADER)
      ════════════════════════════════════════════════════════════════════ */}
      <header style={s.header} className="fade-in-up">
        <div style={s.headerContainer}>
          {/* Logo */}
          <div style={s.logo} onClick={() => navigate("/")}>
            <span style={{ fontSize: "24px" }}>💳</span>
            <span style={{
              background: "linear-gradient(90deg, #00F5D4, #00BBF9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              VittaCard
            </span>
          </div>

          {/* Enlaces centrales (Desktop) */}
          <nav style={{ display: "flex", alignItems: "center", gap: "28px" }} className="desktop-only">
            <a href="#hero" style={s.navLink}>Inicio</a>
            <a href="#problema" style={s.navLink}>Problema</a>
            <a href="#proceso" style={s.navLink}>Cómo funciona</a>
            <a href="#planes" style={s.navLink}>Planes</a>
            <a href="#roles" style={s.navLink}>Roles</a>
            <a href="#contacto" style={s.navLink}>Contacto</a>
            <button onClick={() => setModalEquipo(true)} style={s.navLink}>Equipo</button>
          </nav>

          {/* Lado Derecho buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="desktop-only">
            {/* Tema */}
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: `1px solid ${c.cardBorde}`,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: modoOscuro ? "#fbbf24" : "#64748b",
                transition: "all 0.2s",
              }}
              title={modoOscuro ? "Modo Claro" : "Modo Oscuro"}
              className="btn-hover-ghost"
            >
              {modoOscuro ? "☀️" : "🌙"}
            </button>
            
            {/* Iniciar sesión */}
            <button 
              onClick={() => irALogin(false, "usuario")}
              style={{
                ...s.btnGhost,
                background: c.btnGhostBg,
                borderColor: c.btnGhostBorder,
              }}
              className="btn-hover-ghost"
            >
              Iniciar sesión
            </button>

            {/* Crear cuenta */}
            <button 
              onClick={() => irALogin(true, "usuario")}
              style={s.btnPrimary}
              className="btn-hover"
            >
              Crear cuenta
            </button>
          </div>

          {/* Menú móvil (Hamburger) */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="mobile-only">
            <button
              onClick={toggleTheme}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              {modoOscuro ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "transparent",
                border: `1px solid ${c.cardBorde}`,
                borderRadius: "8px",
                padding: "8px",
                color: c.texto,
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Dropdown de Menú móvil */}
        {mobileMenuOpen && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "20px 24px",
            borderTop: `1px solid ${c.cardBorde}`,
            background: modoOscuro ? "#03131c" : "#fff",
            textAlign: "left",
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
          }}>
            <a href="#hero" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Inicio</a>
            <a href="#problema" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Problema</a>
            <a href="#proceso" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Cómo funciona</a>
            <a href="#planes" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Planes</a>
            <a href="#roles" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Roles</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} style={{ ...s.navLink, display: "block" }}>Contacto</a>
            <button 
              onClick={() => { setMobileMenuOpen(false); setModalEquipo(true); }} 
              style={{ ...s.navLink, display: "block", width: "100%", textAlign: "left" }}
            >
              Equipo
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px", borderTop: `1px solid ${c.cardBorde}` }}>
              <button 
                onClick={() => { setMobileMenuOpen(false); irALogin(false, "usuario"); }} 
                style={{
                  ...s.btnGhost,
                  width: "100%",
                  background: c.btnGhostBg,
                  borderColor: c.btnGhostBorder,
                }}
                className="btn-hover-ghost"
              >
                Iniciar sesión
              </button>
              <button 
                onClick={() => { setMobileMenuOpen(false); irALogin(true, "usuario"); }} 
                style={{ ...s.btnPrimary, width: "100%" }}
                className="btn-hover"
              >
                Crear cuenta
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          2. SECCIÓN HERO
      ════════════════════════════════════════════════════════════════════ */}
      <section 
        id="hero" 
        style={{ 
          minHeight: "calc(100vh - 80px)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ padding: "100px 24px 80px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          <div className="grid-hero">
          
          {/* Texto Hero */}
          <div className="hero-text-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
            <span 
              style={estiloLabelSeccion(c.tealBg, c.tealText, c.tealBorde)}
              className="fade-in-up"
            >
              PLATAFORMA DE BIENESTAR DIGITAL - FUP
            </span>
            
            <h1 
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
                marginBottom: "20px",
              }}
              className="fade-in-up delay-1"
            >
              VittaCard: <br />
              <span style={{
                background: "linear-gradient(90deg, #00F5D4, #00BBF9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                el futuro del bienestar
              </span>
            </h1>
            
            <p 
              style={{
                fontSize: "clamp(14px, 2vw, 17px)",
                lineHeight: 1.6,
                color: c.textoSub,
                marginBottom: "32px",
                maxWidth: "540px",
              }}
              className="fade-in-up delay-2"
            >
              Sistema CRM que centraliza planes de bienestar, tarjeta prepago, aliados comerciales y análisis de consumo en una sola plataforma.
            </p>
            
            <div 
              style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}
              className="fade-in-up delay-3"
            >
              <button
                onClick={() => irALogin(true, "usuario")}
                style={{
                  ...s.btnPrimary,
                  fontSize: "14px",
                  padding: "14px 28px",
                  background: modoOscuro ? "#fff" : "#00B4B4",
                  color: modoOscuro ? "#000" : "#fff",
                  boxShadow: modoOscuro ? "0 10px 25px rgba(255,255,255,0.15)" : "0 10px 25px rgba(0, 180, 180, 0.35)",
                }}
                className={modoOscuro ? "btn-hover-white" : "btn-hover"}
              >
                Crear cuenta gratis
              </button>
              <button
                onClick={() => irALogin(false, "usuario")}
                style={{
                  ...s.btnGhost,
                  fontSize: "14px",
                  padding: "14px 28px",
                  background: modoOscuro ? "rgba(0,180,180,0.08)" : "transparent",
                  borderColor: "#00B4B4",
                  color: modoOscuro ? "#2dd4bf" : "#00B4B4",
                }}
                className="btn-hover-ghost"
              >
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* Gráfico derecho: Tarjeta Platinum CSS */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }} className="fade-in-up delay-2">
            <div style={{ position: "relative" }}>
              
              {/* Resplandor de fondo */}
              <div style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "30px",
                background: "radial-gradient(circle, rgba(0, 180, 180, 0.25) 0%, transparent 70%)",
                filter: "blur(20px)",
                zIndex: 0,
                pointerEvents: "none"
              }} />
              
              {/* Contenedor de la tarjeta */}
              <div 
                style={{
                  position: "relative",
                  width: "360px",
                  height: "210px",
                  borderRadius: "20px",
                  background: modoOscuro 
                    ? "linear-gradient(135deg, rgba(20, 184, 166, 0.8) 0%, rgba(6, 182, 212, 0.65) 45%, rgba(15, 23, 42, 0.95) 100%)" 
                    : "linear-gradient(135deg, rgba(20, 184, 166, 0.9) 0%, rgba(6, 182, 212, 0.75) 45%, rgba(15, 23, 42, 0.9) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 20px 45px rgba(0,0,0,0.35), inset 0 0 20px rgba(255,255,255,0.15)",
                  transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  cursor: "pointer",
                  zIndex: 1,
                  userSelect: "none",
                }}
                className="credit-card-glow hover-card"
              >
                
                {/* Cabecera Tarjeta */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "24px" }}>💳</span>
                    <span style={{ fontStyle: "normal", fontWeight: 850, color: "#fff", fontSize: "17px", letterSpacing: "-0.5px", fontFamily: "Syne" }}>
                      VittaCard
                    </span>
                  </div>
                  
                  {/* Chip dorado CSS */}
                  <div style={{
                    width: "44px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #fef08a 0%, #d97706 100%)",
                    border: "1px solid rgba(254, 240, 138, 0.4)",
                    padding: "5px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ height: "1px", background: "rgba(0,0,0,0.12)" }} />
                    <div style={{ height: "1px", background: "rgba(0,0,0,0.12)" }} />
                    <div style={{ height: "1px", background: "rgba(0,0,0,0.12)" }} />
                  </div>
                </div>

                {/* Número de Tarjeta */}
                <div style={{ margin: "14px 0" }}>
                  <p style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    letterSpacing: "4px",
                    color: "#ffffff",
                    fontFamily: "monospace",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.4)"
                  }}>
                    5200 4567 8901 2345
                  </p>
                </div>

                {/* Pie de la Tarjeta */}
                <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ fontSize: "8px", uppercase: "true", letterSpacing: "1px", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: "2px" }}>TITULAR</p>
                    <p style={{ fontSize: "13px", fontWeight: 700, tracking: "0.5px", color: "#fff", textTransform: "uppercase" }}>VittaCard User</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.2)",
                      fontSize: "9px",
                      fontWeight: 800,
                      color: "#fff",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px"
                    }}>
                      Premium
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* ════════════════════════════════════════════════════════════════════
        3. SECCIÓN PROBLEMA
    ════════════════════════════════════════════════════════════════════ */}
    <section 
      id="problema" 
      style={{ 
        background: modoOscuro ? "rgba(2, 12, 18, 0.75)" : "rgba(241, 245, 249, 0.85)",
        borderTop: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
        borderBottom: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
      }}
    >
      <div className="section-container">
          
          <div className="reveal" style={{ textAlign: "left", maxWidth: "640px", marginBottom: "48px" }}>
            <span style={estiloLabelSeccion(c.redBg, c.redText, c.redBorde)}>
              Problema
            </span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Beneficios de salud dispersos y difíciles de gestionar
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: c.textoSub }}>
              Las personas que buscan acceder a descuentos en salud, farmacias, gimnasios y comercios aliados deben usar múltiples canales sin integración ni seguimiento centralizado.
            </p>
          </div>

          <div className="grid-3-col">
            {/* Tarjeta 1 */}
            <div 
              style={estiloCard}
              className="reveal hover-card-red"
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: c.redBg,
                border: `1px solid ${c.redBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.redText,
                fontWeight: 800,
                fontSize: "18px",
                marginBottom: "24px",
              }}>
                ✕
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>Sin integración</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub }}>
                Múltiples apps para distintos beneficios sin conexión entre sí, provocando confusión y pérdidas de tiempo.
              </p>
            </div>

            {/* Tarjeta 2 */}
            <div 
              style={estiloCard}
              className="reveal hover-card-red"
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: c.redBg,
                border: `1px solid ${c.redBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.redText,
                fontWeight: 800,
                fontSize: "18px",
                marginBottom: "24px",
              }}>
                ✕
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>Sin seguimiento</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub }}>
                No hay forma de ver el historial consolidado de gastos, ahorros reales y beneficios activos en un único panel.
              </p>
            </div>

            {/* Tarjeta 3 */}
            <div 
              style={estiloCard}
              className="reveal hover-card-red"
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: c.redBg,
                border: `1px solid ${c.redBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.redText,
                fontWeight: 800,
                fontSize: "18px",
                marginBottom: "24px",
              }}>
                ✕
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>Sin análisis</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub }}>
                Los comercios no conocen el comportamiento real de sus clientes, perdiendo oportunidades clave de fidelización.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          4. SECCIÓN PROCESO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="proceso" style={{
        borderBottom: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
      }}>
        <div className="section-container">
          <div className="reveal" style={{ textAlign: "left", marginBottom: "48px" }}>
          <span style={estiloLabelSeccion(c.tealBg, c.tealText, c.tealBorde)}>
            Proceso
          </span>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            ¿Cómo funciona VittaCard?
          </h2>
        </div>

        <div className="grid-3-col">
          
          {/* Tarjeta Proceso 1 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              1
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Registro</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Crea tu cuenta eligiendo tu rol de ingreso: usuario general, aliado comercial o administrador.
            </p>
          </div>

          {/* Tarjeta Proceso 2 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              2
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Elige tu plan</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Selecciona la membresía que más se adapte a tus necesidades entre Free, Básico, Plus o Premium.
            </p>
          </div>

          {/* Tarjeta Proceso 3 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              3
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Activa tu tarjeta</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Recibe tu VittaCard digital instantáneamente con tu código QR único y saldo de prueba activado.
            </p>
          </div>

          {/* Tarjeta Proceso 4 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              4
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Úsala en aliados</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Paga con descuentos automatizados y cashback en clínicas, laboratorios, farmacias y centros deportivos aliados.
            </p>
          </div>

          {/* Tarjeta Proceso 5 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              5
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Ve tu historial</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Consulta cada transacción, ahorro consolidado y saldo disponible en tiempo real desde tu panel personal.
            </p>
          </div>

          {/* Tarjeta Proceso 6 */}
          <div 
            style={estiloCard}
            className="reveal hover-card"
          >
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: c.tealBg,
              border: `1px solid ${c.tealBorde}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: c.tealText,
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              6
            </span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Análisis VittaData</h3>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: c.textoSub }}>
              Los administradores acceden a análisis de tendencias consolidadas e identifican nuevas alianzas estratégicas.
            </p>
          </div>

        </div>
      </div>
    </section>

      {/* 5. SECCIÓN PLANES */}
      <section id="planes" style={{
        background: modoOscuro ? "rgba(2, 12, 18, 0.75)" : "rgba(241, 245, 249, 0.85)",
        borderBottom: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
      }}>
        <div className="section-container">
          <div className="reveal" style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 56px auto" }}>
            <span style={estiloLabelSeccion(c.tealBg, c.tealText, c.tealBorde)}>
              Planes
            </span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Elige tu plan VittaCard
            </h2>
            <p style={{ fontSize: "14px", color: c.textoSub }}>
              Beneficios reales desde el primer día, sin compromisos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
            {[...planes].sort((a, b) => (a.cuota || 0) - (b.cuota || 0)).map((plan) => {
              const esPremium = plan.id === "premium";
              const esPlus = plan.id === "plus";
              const esBasico = plan.id === "basico";
              const esFree = plan.id === "free";
              
              return (
                <div 
                  key={plan.id}
                  className={`reveal flex flex-col justify-between p-8 rounded-2xl relative transition-all duration-300 hover:-translate-y-2 ${
                    esPremium 
                      ? "bg-gradient-to-b from-purple-600 to-indigo-800 text-white shadow-xl shadow-purple-600/20 border border-purple-500/30" 
                      : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {esPremium && (
                    <div className="absolute -top-3 right-6 bg-yellow-400 text-slate-900 text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      RECOMENDADO
                    </div>
                  )}

                  <div>
                    <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                      esPremium ? "text-purple-200" : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {plan.subtitulo || (esFree ? "Básico" : esBasico ? "Esencial" : esPlus ? "Avanzado" : "Recomendado")}
                    </p>

                    <h3 className={`text-2xl font-black mb-4 font-['Syne'] ${
                      esPremium ? "text-white" : esFree ? "text-slate-600 dark:text-slate-400" : esBasico ? "text-blue-500" : "text-blue-600"
                    }`}>
                      {plan.nombre}
                    </h3>
                    
                    <div className="flex items-baseline mb-6">
                      <span className="text-4xl font-extrabold tracking-tight">
                        ${plan.cuota === 0 ? "0" : plan.cuota?.toLocaleString()}
                      </span>
                      <span className={`text-xs ml-1 font-semibold ${
                        esPremium ? "text-purple-200" : "text-slate-500 dark:text-slate-400"
                      }`}>/mes</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {(plan.beneficios || []).map((beneficio, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs">
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            esPremium ? "text-yellow-400" : "text-blue-600 dark:text-blue-400"
                          }`} />
                          <span className={esPremium ? "text-purple-50" : "text-slate-600 dark:text-slate-300"}>
                            {beneficio}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => irALogin(true, "usuario")}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 text-center ${
                      esPremium
                        ? "bg-yellow-400 text-slate-900 hover:bg-yellow-500 shadow-md shadow-yellow-400/20"
                        : esFree
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          : esBasico
                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    }`}
                  >
                    {esPremium ? "Obtener Premium" : esFree ? "Crear Cuenta Gratis" : `Obtener ${plan.nombre}`}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          6. SECCIÓN ROLES
      ════════════════════════════════════════════════════════════════════ */}
      <section id="roles" style={{
        borderBottom: modoOscuro ? "1px solid rgba(20, 184, 166, 0.15)" : "1px solid rgba(226, 232, 240, 0.8)",
      }}>
        <div className="section-container">
          <div className="reveal" style={{ textAlign: "left", marginBottom: "48px" }}>
          <span style={estiloLabelSeccion(c.tealBg, c.tealText, c.tealBorde)}>
            Roles
          </span>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            ¿Quién usa VittaCard?
          </h2>
        </div>

        <div className="grid-3-col">
          
          {/* Rol 1: Usuario */}
          <div 
            style={{ ...estiloCard, justifyContent: "space-between" }}
            className="reveal hover-card"
          >
            <div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: c.tealBg,
                border: `1px solid ${c.tealBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginBottom: "24px",
              }}>
                👤
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Usuario</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub, marginBottom: "24px" }}>
                Se registra, elige un plan, usa su tarjeta digital en comercios aliados y consulta su historial completo de transacciones y beneficios de ahorro.
              </p>
            </div>
            <button 
              onClick={() => irALogin(true, "usuario")}
              style={{
                ...s.btnGhost,
                background: c.tealBg,
                borderColor: c.tealBorde,
                color: c.tealText,
                width: "100%",
              }}
              className="btn-hover-ghost"
            >
              Registrarme
            </button>
          </div>

          {/* Rol 2: Aliado Comercial */}
          <div 
            style={{ ...estiloCard, justifyContent: "space-between" }}
            className="reveal hover-card"
          >
            <div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: c.indigoBg,
                border: `1px solid ${c.indigoBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginBottom: "24px",
              }}>
                🏪
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Aliado Comercial</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub, marginBottom: "24px" }}>
                Registra su negocio en la red, recibe pagos escaneando códigos QR de clientes VittaCard y analiza su volumen de ventas e ingresos mensuales.
              </p>
            </div>
            <button 
              onClick={() => irALogin(true, "aliado")}
              style={{
                ...s.btnGhost,
                background: c.indigoBg,
                borderColor: c.indigoBorde,
                color: c.indigoText,
                width: "100%",
              }}
              className="btn-hover-ghost"
            >
              Registrar negocio
            </button>
          </div>

          {/* Rol 3: Administrador */}
          <div 
            style={{ ...estiloCard, justifyContent: "space-between" }}
            className="reveal hover-card"
          >
            <div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: c.blueBg,
                border: `1px solid ${c.blueBorde}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginBottom: "24px",
              }}>
                🛡️
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "12px" }}>Administrador</h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: c.textoSub, marginBottom: "24px" }}>
                Gestiona el CRM completo: alta de usuarios, configuración de planes, validación de comercios aliados y auditoría del módulo central VittaData.
              </p>
            </div>
            <button 
              onClick={() => irALogin(false, "admin")}
              style={{
                ...s.btnGhost,
                background: c.blueBg,
                borderColor: c.blueBorde,
                color: c.blueText,
                width: "100%",
              }}
              className="btn-hover-ghost"
            >
              Acceso admin
            </button>
          </div>

        </div>
      </div>
    </section>

      {/* ════════════════════════════════════════════════════════════════════
          7. SECCIÓN CONTACTO
      ════════════════════════════════════════════════════════════════════ */}
      <section id="contacto" style={{
        background: modoOscuro ? "rgba(2, 12, 18, 0.75)" : "rgba(241, 245, 249, 0.85)",
        borderBottom: "none",
      }}>
        <div className="section-container">
          
          <div className="reveal" style={{ textAlign: "left", maxWidth: "640px", marginBottom: "48px" }}>
            <span style={estiloLabelSeccion(c.tealBg, c.tealText, c.tealBorde)}>
              Contacto
            </span>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.5px" }}>
              Hablemos de tu bienestar
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: c.textoSub }}>
              ¿Tienes preguntas sobre VittaCard? ¿Quieres convertir tu negocio en aliado? Escríbenos y te respondemos en menos de 24 horas.
            </p>
          </div>

          <div className="grid-2-col">
            
            {/* Columna izquierda (Información) */}
            <div className="contact-info-grid">
              
              <div 
                style={{ ...estiloCard, padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "16px" }}
                className="reveal hover-card"
              >
                <span style={{ fontSize: "24px" }}>✉️</span>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 800, color: c.textoSub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Email corporativo</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#00B4B4", margin: 0 }}>vittacard@fup.edu.co</p>
                </div>
              </div>

              <div 
                style={{ ...estiloCard, padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "16px" }}
                className="reveal hover-card"
              >
                <span style={{ fontSize: "24px" }}>💬</span>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 800, color: c.textoSub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>WhatsApp de soporte</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#00B4B4", margin: 0 }}>+57 300 000 0000</p>
                </div>
              </div>

              <div 
                style={{ ...estiloCard, padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "16px" }}
                className="reveal hover-card"
              >
                <span style={{ fontSize: "24px" }}>📍</span>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 800, color: c.textoSub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Sede Principal</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#00B4B4", margin: 0 }}>Popayán, Cauca — Colombia</p>
                </div>
              </div>

              <div 
                style={{ ...estiloCard, padding: "20px 24px", flexDirection: "row", alignItems: "center", gap: "16px" }}
                className="reveal hover-card"
              >
                <span style={{ fontSize: "24px" }}>⏰</span>
                <div>
                  <p style={{ fontSize: "9px", fontWeight: 800, color: c.textoSub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>Horario de atención</p>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#00B4B4", margin: 0 }}>Lun a Sáb - 8:00 AM a 6:00 PM</p>
                </div>
              </div>

            </div>

            {/* Columna derecha (Formulario en tarjeta oscura) */}
            <div className="reveal">
              <div style={estiloCard}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Envíanos un mensaje</h3>
                <p style={{ fontSize: "12px", color: c.textoSub, marginBottom: "24px" }}>
                  Completa los campos obligatorios para enviar tu requerimiento.
                </p>

                <form onSubmit={handleContactoSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: c.textoSub, marginBottom: "8px" }}>Tu nombre *</label>
                    <input 
                      type="text" value={nombre} required onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${c.inputBorde}`,
                        background: c.inputBg,
                        color: c.texto,
                        fontSize: "13px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = c.inputFocus}
                      onBlur={e => e.target.style.borderColor = c.inputBorde}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: c.textoSub, marginBottom: "8px" }}>Correo electrónico *</label>
                    <input 
                      type="email" value={correo} required onChange={e => setCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${c.inputBorde}`,
                        background: c.inputBg,
                        color: c.texto,
                        fontSize: "13px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = c.inputFocus}
                      onBlur={e => e.target.style.borderColor = c.inputBorde}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: c.textoSub, marginBottom: "8px" }}>Mensaje *</label>
                    <textarea 
                      rows="4" value={mensaje} required onChange={e => setMensaje(e.target.value)}
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: `1px solid ${c.inputBorde}`,
                        background: c.inputBg,
                        color: c.texto,
                        fontSize: "13px",
                        outline: "none",
                        resize: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={e => e.target.style.borderColor = c.inputFocus}
                      onBlur={e => e.target.style.borderColor = c.inputBorde}
                    />
                  </div>

                  <button
                    type="submit" disabled={enviado}
                    style={{
                      ...s.btnPrimary,
                      width: "100%",
                      padding: "14px",
                      fontSize: "13px",
                      marginTop: "8px",
                      opacity: enviado ? 0.7 : 1,
                    }}
                    className="btn-hover"
                  >
                    {enviado ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          8. FOOTER (PIE DE PÁGINA)
      ════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0a1128] text-slate-400 py-16 border-t border-slate-800/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Columna 1: Marca */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💳</span>
                <span className="font-extrabold text-lg font-['Syne'] bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                  VittaCard
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                La plataforma inteligente de bienestar que conecta usuarios y comercios aliados en tiempo real. Simplifica tu salud y maximiza tus ahorros.
              </p>
            </div>

            {/* Columna 2: Conócenos */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Conócenos
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li>
                  <a href="#hero" className="hover:text-white transition-colors duration-200">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#proceso" className="hover:text-white transition-colors duration-200">
                    Cómo Funciona
                  </a>
                </li>
                <li>
                  <a href="#planes" className="hover:text-white transition-colors duration-200">
                    Planes
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => setModalEquipo(true)}
                    className="hover:text-white transition-colors duration-200 text-left cursor-pointer bg-transparent border-none p-0"
                  >
                    Equipo de Desarrollo
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna 3: Para Usuarios */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Para Usuarios
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li>
                  <a 
                    href="#planes" 
                    className="hover:text-white transition-colors duration-200"
                  >
                    Membresías
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(true, "usuario"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Registro Usuario
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "usuario"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Iniciar Sesión
                  </a>
                </li>
                <li>
                  <a 
                    href="#contacto" 
                    className="hover:text-white transition-colors duration-200"
                  >
                    Soporte Usuario
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 4: Para Comercios */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Para Comercios
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "aliado"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Portal Aliados
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(true, "aliado"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Registro Comercio
                  </a>
                </li>
                <li>
                  <a 
                    href="#roles" 
                    className="hover:text-white transition-colors duration-200"
                  >
                    Beneficios Aliados
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "aliado"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Validar Código QR
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna 5: Legal y Seguridad */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                Legal y Seguridad
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs">
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "usuario"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Términos de Servicio
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "usuario"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); irALogin(false, "usuario"); }}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Seguridad de Datos
                  </a>
                </li>
                <li>
                  <a 
                    href="#contacto" 
                    className="hover:text-white transition-colors duration-200"
                  >
                    Contacto Directo
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divisor */}
          <div className="border-t border-slate-800/80 my-8"></div>

          {/* Subfooter */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-slate-500">
              © 2026 VittaCard · FUP. Popayán, Colombia. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-500 hover:text-white transition-colors duration-200">
                Instagram
              </a>
              <span className="text-slate-800">|</span>
              <a href="#" className="text-slate-500 hover:text-white transition-colors duration-200">
                Facebook
              </a>
              <span className="text-slate-800">|</span>
              <a href="#" className="text-slate-500 hover:text-white transition-colors duration-200">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — EQUIPO DE DESARROLLO
      ════════════════════════════════════════════════════════════════════ */}
      {modalEquipo && (
        <div
          onClick={() => setModalEquipo(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(2, 8, 12, 0.8)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              ...estiloCard,
              width: "100%",
              maxWidth: "440px",
              padding: "36px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Header */}
            <p style={{ fontSize: "9px", fontWeight: 800, uppercase: "true", letterSpacing: "1.5px", color: c.textoSub, marginBottom: "4px" }}>
              INGENIERÍA DE SOFTWARE · 2026
            </p>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "4px", fontFamily: "Syne" }}>Equipo de desarrollo</h3>
            <p style={{ fontSize: "12px", color: c.textoSub, marginBottom: "28px" }}>
              Fundación Universitaria de Popayán — VittaCard CRM
            </p>

            {/* Integrantes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
              {INTEGRANTES.map((p, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  border: `1px solid ${c.cardBorde}`,
                  background: modoOscuro ? "rgba(2, 8, 12, 0.4)" : "rgba(241, 245, 249, 0.5)",
                }}>
                  {/* Iniciales */}
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: c.tealBg,
                    border: `1px solid ${c.tealBorde}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.tealText,
                    fontWeight: 800,
                    fontSize: "12px",
                    flexShrink: 0,
                  }}>
                    {p.nombre.split(" ").slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 2px 0" }}>{p.nombre}</p>
                    <p style={{ fontSize: "10px", color: c.textoSub, margin: 0 }}>{p.rol}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setModalEquipo(false)}
              style={{
                ...s.btnGhost,
                width: "100%",
                padding: "12px",
                background: c.btnGhostBg,
                borderColor: c.btnGhostBorder,
              }}
              className="btn-hover-ghost"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
