import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase/config";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Globe, 
  RefreshCw, 
  Sliders, 
  Plus, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle,
  AlertTriangle,
  KeyRound
} from "lucide-react";

export default function MisTarjetas() {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [tarjeta, setTarjeta] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados visuales y de interacción
  const [verDetalles, setVerDetalles] = useState(false);
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [msgExito, setMsgExito] = useState("");
  const [loadingAccion, setLoadingAccion] = useState(false);

  // Configuración de temas
  const themeStyles = {
    bg: theme === "dark" ? "#090D16" : "#F8FAFC", // Slate-950 background for dark mode
    cardBg: theme === "dark" ? "#0F172A" : "#FFFFFF", // Slate-900 for cards in dark mode
    border: theme === "dark" ? "#1E293B" : "#E2E8F0", // Slate-800 borders in dark mode
    text: theme === "dark" ? "#F8FAFC" : "#0F172A", // Slate-50 texts in dark mode
    textMuted: theme === "dark" ? "#94A3B8" : "#64748B",
    sidebarBg: theme === "dark" ? "#0F172A" : "#FFFFFF",
    headerBg: "#0F172A",
  };

  // Cargar perfil del usuario
  useEffect(() => {
    if (!currentUser) return;

    const fetchPerfil = async () => {
      try {
        const uSnap = await getDocs(query(collection(db, "usuarios"), where("correo", "==", currentUser.email)));
        if (!uSnap.empty) {
          setPerfil(uSnap.docs[0].data());
          setPerfilId(uSnap.docs[0].id);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      }
    };
    fetchPerfil();
  }, [currentUser]);

  // Listener en tiempo real para la tarjeta virtual del usuario
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "tarjetas"), where("correo", "==", currentUser.email));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setTarjeta({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setTarjeta(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error al suscribirse a tarjeta:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Revelado temporal (10 segundos) del CVV/PAN
  const toggleVerDetalles = () => {
    if (!verDetalles) {
      setVerDetalles(true);
      setTimeout(() => {
        setVerDetalles(false);
      }, 10000); // Se vuelve a enmascarar automáticamente tras 10 segundos
    } else {
      setVerDetalles(false);
    }
  };

  // Crear Tarjeta Virtual Mock (Visa 4532)
  const handleCrearTarjeta = async () => {
    if (!currentUser || !perfil) return;
    setLoadingAccion(true);
    try {
      const randomDigits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      const numero = `4532${randomDigits}`; // 16 dígitos
      
      const now = new Date();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const anio = String(now.getFullYear() + 5).slice(-2);
      const vencimiento = `${mes}/${anio}`;
      
      const cvv = String(Math.floor(100 + Math.random() * 900));

      const nuevaTarjeta = {
        usuarioId: perfilId || "",
        correo: currentUser.email,
        nombreTitular: perfil.nombres || currentUser.email,
        numero,
        vencimiento,
        cvv,
        bloqueada: false,
        comprasInternacionales: false,
        cvvDinamico: false,
        pin: "1234",
        solicitudFisica: false,
        creadoEn: new Date()
      };

      await addDoc(collection(db, "tarjetas"), nuevaTarjeta);
      setMsgExito("¡Tu tarjeta virtual VittaCard ha sido creada con éxito!");
      setTimeout(() => setMsgExito(""), 5000);
    } catch (err) {
      console.error("Error creando tarjeta virtual:", err);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Toggles de seguridad reactivos en Firestore
  const handleToggleSeguridad = async (campo, valorActual) => {
    if (!tarjeta) return;
    try {
      await updateDoc(doc(db, "tarjetas", tarjeta.id), {
        [campo]: !valorActual
      });
    } catch (err) {
      console.error(`Error actualizando ${campo}:`, err);
    }
  };

  // Guardar nuevo PIN de la tarjeta
  const handleSavePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setPinError("El PIN debe ser un código numérico exacto de 4 dígitos.");
      return;
    }
    setLoadingAccion(true);
    try {
      await updateDoc(doc(db, "tarjetas", tarjeta.id), { pin: newPin });
      setMsgExito("PIN de seguridad actualizado con éxito.");
      setEditingPin(false);
      setNewPin("");
      setPinError("");
      setTimeout(() => setMsgExito(""), 5000);
    } catch (err) {
      console.error("Error al actualizar PIN:", err);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Solicitar Tarjeta Física
  const handleSolicitarFisica = async () => {
    if (!tarjeta) return;
    setLoadingAccion(true);
    try {
      await updateDoc(doc(db, "tarjetas", tarjeta.id), { solicitudFisica: true });
      setMsgExito("Solicitud de tarjeta física recibida. Llegará en 5 días hábiles.");
      setTimeout(() => setMsgExito(""), 5000);
    } catch (err) {
      console.error("Error solicitando tarjeta física:", err);
    } finally {
      setLoadingAccion(false);
    }
  };

  // Badge del Plan de la membresía del usuario
  const getPlanBadge = (planId) => {
    const pid = (planId || "free").toLowerCase();
    let style = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "700",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      verticalAlign: "middle"
    };
    let text = "";

    switch (pid) {
      case "free":
        style = { ...style, background: "#475569", color: "#E2E8F0", border: "1px solid #64748B" };
        text = "Free";
        break;
      case "basico":
        style = { ...style, background: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.4)" };
        text = "Básico";
        break;
      case "plus":
        style = { ...style, background: "rgba(20, 184, 166, 0.15)", color: "#2DD4BF", border: "1px solid rgba(20, 184, 166, 0.4)" };
        text = "Plus";
        break;
      case "premium":
        style = { 
          ...style, 
          background: "linear-gradient(135deg, #7C3AED 0%, #D97706 100%)", 
          color: "#FFFFFF", 
          border: "1px solid #F59E0B",
          boxShadow: "0 0 10px rgba(124, 58, 237, 0.6), inset 0 0 4px rgba(255, 255, 255, 0.4)"
        };
        text = "Premium";
        break;
      default:
        style = { ...style, background: "#475569", color: "#E2E8F0" };
        text = planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "Free";
    }

    return (
      <span style={style}>
        {text}
      </span>
    );
  };

  // Botón lateral estilizado
  const menuBtn = (id, label) => {
    const isCurrent = id === 'tarjetas';
    return (
      <button
        onClick={() => {
          if (id === 'tarjetas') {
            // Ya está en tarjetas
          } else {
            navigate('/usuario/dashboard', { state: { seccion: id } });
          }
        }}
        style={{
          background: isCurrent ? '#06B6D4' : themeStyles.sidebarBg,
          color: isCurrent ? '#fff' : themeStyles.text,
          border: '1px solid ' + themeStyles.border,
          borderRadius: '10px',
          padding: '10px 14px',
          cursor: 'pointer',
          fontWeight: 600,
          textAlign: 'left',
          transition: 'all 0.15s'
        }}
      >
        {label}
      </button>
    );
  };

  // Helper para enmascarar PAN (ej: 4532 **** **** 1234)
  const formatCardNumber = (num, visible) => {
    if (!num) return "";
    if (visible) {
      return num.replace(/(\d{4})/g, '$1 ').trim();
    } else {
      return `${num.slice(0, 4)} **** **** ${num.slice(-4)}`;
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', fontFamily: 'inherit', color: themeStyles.text, background: themeStyles.bg, minHeight: '100vh' }}>Cargando portal de tarjetas...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.text, fontFamily: "'Inter', system-ui, sans-serif", transition: "background 0.2s" }}>
      
      {/* Barra Superior */}
      <div style={{ background: themeStyles.headerBg, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: "22px" }}>💳</span>
          <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Syne', fontWeight: 800 }}>VittaCard Usuario</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Botón de alternancia de Modo Oscuro */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94A3B8', fontSize: '13px' }}>{perfil?.correo}</span>
            {getPlanBadge(perfil?.planId)}
          </div>
          <button 
            onClick={logout} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '10px', 
              border: 'none', 
              background: '#EF4444', 
              color: 'white', 
              fontWeight: 600, 
              cursor: 'pointer',
              transition: 'background 0.15s' 
            }}
            onMouseEnter={e => e.target.style.background = '#DC2626'}
            onMouseLeave={e => e.target.style.background = '#EF4444'}
          >
            Salir 🚪
          </button>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* Barra Lateral */}
        <aside style={{ width: '250px', background: themeStyles.sidebarBg, minHeight: 'calc(100vh - 60px)', padding: '20px', borderRight: '1px solid ' + themeStyles.border, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {menuBtn('inicio', '🏠 Inicio')}
          {menuBtn('membresia', '💳 Mi membresía')}
          {menuBtn('tarjetas', '🪪 Mis Tarjetas')}
          {menuBtn('comercios', '🏪 Comercios')}
          {menuBtn('compras', '🛒 Compras')}
          {menuBtn('transacciones', '💰 Transacciones')}
          {menuBtn('beneficios', '🎁 Beneficios')}
          {menuBtn('ajustes', '⚙️ Ajustes')}
        </aside>

        {/* Contenido Principal */}
        <main style={{ flex: 1, padding: '24px' }}>
          
          {msgExito && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 p-4 rounded-xl mb-6 text-sm font-semibold transition-all">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{msgExito}</span>
            </div>
          )}

          <div style={{ background: themeStyles.cardBg, border: '1px solid ' + themeStyles.border, color: themeStyles.text, padding: '28px', borderRadius: '20px', transition: "background 0.2s" }}>
            
            {/* Encabezado de la página */}
            <div className="mb-8">
              <h1 className="text-3xl font-black font-['Syne'] tracking-tight">Mis Tarjetas</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Gestiona tus tarjetas virtuales VittaCard para compras online y pagos seguros.
              </p>
            </div>

            {/* Grid Principal de 2 Columnas (Carrusel y Seguridad) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Primeras 2 columnas (Izquierda y Centro) */}
              <div className="lg:col-span-2 flex flex-col justify-between">
                
                {/* Contenedor de Tarjeta Virtual */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/80 rounded-2xl min-h-[300px]">
                  
                  {!tarjeta ? (
                    /* Estado de Tarjeta: Sin Tarjeta (Placeholder) */
                    <button 
                      onClick={handleCrearTarjeta}
                      disabled={loadingAccion}
                      className="group flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-350 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 rounded-2xl p-8 w-full max-w-md aspect-[1.586/1] bg-white dark:bg-slate-900/40 hover:bg-teal-500/[0.02] transition-all duration-300 cursor-pointer outline-none"
                    >
                      <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                        <Plus className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mt-4">Crear nueva tarjeta virtual</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
                        Genera una tarjeta virtual instantánea para compras digitales seguras.
                      </p>
                    </button>
                  ) : (
                    /* Tarjeta de Crédito Premium (Glassmorphic) */
                    <div className="relative w-full max-w-md aspect-[1.586/1] bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 rounded-3xl p-6 text-white border border-slate-700/50 shadow-2xl overflow-hidden group">
                      
                      {/* Efectos de luz flotantes detrás */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all duration-500"></div>
                      <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                      
                      {/* Capa de bloqueo temporal */}
                      {tarjeta.bloqueada && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-15 p-4 text-center">
                          <Lock className="w-10 h-10 text-rose-500 animate-pulse mb-3" />
                          <h4 className="text-xs font-black tracking-widest text-rose-500 uppercase">Tarjeta Bloqueada Temporalmente</h4>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[250px]">
                            Desactiva el bloqueo temporal en el menú lateral para usarla de nuevo.
                          </p>
                        </div>
                      )}

                      {/* Header de la tarjeta */}
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-slate-450 uppercase">VittaCard</span>
                          <span className="text-[8px] font-extrabold uppercase bg-teal-500/20 text-teal-350 px-2 py-0.5 rounded-full ml-2 border border-teal-550/20">Virtual</span>
                        </div>
                        <h3 className="font-extrabold text-base tracking-wide font-['Syne'] bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent uppercase">
                          PREPAID
                        </h3>
                      </div>

                      {/* Chip Dorado y Símbolo de Pago sin Contacto */}
                      <div className="mt-5 flex justify-between items-center relative z-10">
                        <div className="w-10 h-7.5 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-md border border-yellow-200/50 shadow-inner relative overflow-hidden flex flex-col justify-between p-1.5">
                          <div className="border-t border-yellow-800/25 h-full w-full absolute top-1.5 left-0"></div>
                          <div className="border-l border-yellow-800/25 h-full w-full absolute top-0 left-3.5"></div>
                          <div className="border-r border-yellow-800/25 h-full w-full absolute top-0 right-3.5"></div>
                        </div>
                        <svg className="w-6 h-6 text-slate-400 fill-current opacity-70" viewBox="0 0 24 24">
                          <path d="M4 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.5-1.5c0-2.48-2.02-4.5-4.5-4.5v1.5c1.65 0 3 1.35 3 3h1.5zm3.5 0c0-4.41-3.59-8-8-8v1.5c3.58 0 6.5 2.92 6.5 6.5H11zm3.5 0c0-6.34-5.16-11.5-11.5-11.5V3c7.17 0 13 5.83 13 13h-1.5z" />
                        </svg>
                      </div>

                      {/* Número de la tarjeta enmascarado/revelado */}
                      <div className="mt-5 relative z-10 flex justify-between items-center">
                        <h2 className="font-mono text-lg md:text-xl tracking-widest text-slate-100 select-all">
                          {formatCardNumber(tarjeta.numero, verDetalles)}
                        </h2>
                        <button 
                          onClick={toggleVerDetalles}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-colors duration-150 cursor-pointer text-slate-400 hover:text-white outline-none"
                          title={verDetalles ? "Enmascarar datos" : "Mostrar datos de tarjeta (10s)"}
                        >
                          {verDetalles ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Footer de la tarjeta: Nombre, Vencimiento y CVV */}
                      <div className="mt-5 flex justify-between items-end relative z-10">
                        <div>
                          <p className="text-[7px] font-bold text-slate-550 uppercase tracking-widest">Titular</p>
                          <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider truncate max-w-[180px]">
                            {tarjeta.nombreTitular}
                          </p>
                        </div>

                        <div className="flex gap-6">
                          <div>
                            <p className="text-[7px] font-bold text-slate-550 uppercase tracking-widest">Vence</p>
                            <p className="text-[11px] font-semibold text-slate-200 tracking-wider">
                              {tarjeta.vencimiento}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] font-bold text-slate-550 uppercase tracking-widest">CVV</p>
                            <p className="text-[11px] font-semibold text-slate-200 tracking-wider">
                              {verDetalles ? tarjeta.cvv : "***"}
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Banner de Tarjeta Física (Debajo de la Virtual) */}
                <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tarjeta Física VittaCard</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Llega a tu casa en 5 días. Solicítala para pagos en datáfonos.
                      </p>
                    </div>
                  </div>

                  <div>
                    {!tarjeta ? (
                      /* Si no tiene virtual creada, no puede solicitar física */
                      <button
                        disabled
                        className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-655 font-bold px-6 py-2.5 rounded-xl cursor-not-allowed text-xs border border-slate-300 dark:border-slate-750"
                        title="Debes crear primero tu tarjeta virtual"
                      >
                        Solicitar Tarjeta Física
                      </button>
                    ) : tarjeta.solicitudFisica ? (
                      /* Tarjeta física solicitada */
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-2.5 rounded-xl font-bold text-xs select-none">
                        <CheckCircle className="w-4 h-4" />
                        <span>En camino (5 días)</span>
                      </div>
                    ) : (
                      /* Solicitar física */
                      <button
                        onClick={handleSolicitarFisica}
                        disabled={loadingAccion}
                        className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-teal-500/10 text-xs cursor-pointer outline-none"
                      >
                        Solicitar Tarjeta Física
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Columna Derecha (Ajustes de Seguridad) */}
              <div className="flex flex-col">
                
                <div className="p-6 bg-slate-50/20 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/80 rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    
                    {/* Cabecera del Panel */}
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800/80">
                      <Sliders className="w-5 h-5 text-teal-500" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Ajustes de Seguridad</h3>
                    </div>

                    {!tarjeta ? (
                      /* Placeholder si no hay tarjeta */
                      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                        <ShieldAlert className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-4" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Crea una nueva tarjeta virtual para configurar sus ajustes de seguridad.
                        </p>
                      </div>
                    ) : (
                      /* Lista de interruptores de seguridad activos */
                      <div className="flex flex-col mt-2">
                        
                        {/* Interruptor 1: Bloquear Temporalmente */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800/60">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-slate-500 dark:text-slate-400">
                              {tarjeta.bloqueada ? <Lock size={16} className="text-rose-500" /> : <Unlock size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bloquear Temporalmente</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Congela tu tarjeta inmediatamente</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSeguridad("bloqueada", tarjeta.bloqueada)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                              tarjeta.bloqueada ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              tarjeta.bloqueada ? 'translate-x-5.5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        {/* Interruptor 2: Compras Internacionales */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800/60">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-slate-500 dark:text-slate-400">
                              <Globe size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Compras Internacionales</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Permitir transacciones en el exterior</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSeguridad("comprasInternacionales", tarjeta.comprasInternacionales)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                              tarjeta.comprasInternacionales ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              tarjeta.comprasInternacionales ? 'translate-x-5.5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        {/* Interruptor 3: CVV Dinámico */}
                        <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800/60">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-slate-500 dark:text-slate-400">
                              <RefreshCw size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">CVV Dinámico</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cambia el CVV cada 5 minutos</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSeguridad("cvvDinamico", tarjeta.cvvDinamico)}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 outline-none cursor-pointer ${
                              tarjeta.cvvDinamico ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              tarjeta.cvvDinamico ? 'translate-x-5.5' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>

                        {/* Fila 4: Cambiar PIN de seguridad */}
                        <div className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 text-slate-500 dark:text-slate-400">
                                <KeyRound size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Cambiar PIN</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">PIN de 4 dígitos para transacciones físicas</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingPin(!editingPin)}
                              className="text-xs font-semibold text-teal-500 hover:text-teal-400 cursor-pointer outline-none bg-transparent border-none p-0"
                            >
                              {editingPin ? "Cancelar" : "Modificar"}
                            </button>
                          </div>

                          {editingPin && (
                            <form onSubmit={handleSavePin} className="mt-3 flex gap-2 items-stretch animate-fadeIn">
                              <div className="flex-1">
                                <input
                                  type="password"
                                  placeholder="Nuevo PIN (4 dígitos)"
                                  value={newPin}
                                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                  maxLength={4}
                                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-teal-500 transition-colors"
                                  required
                                />
                                {pinError && <p className="text-[10px] text-rose-500 mt-1">{pinError}</p>}
                              </div>
                              <button
                                type="submit"
                                disabled={loadingAccion}
                                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer outline-none"
                              >
                                Guardar
                              </button>
                            </form>
                          )}
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Detalle adicional de seguridad en footer de panel */}
                  {tarjeta && (
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl mt-4 text-[10px] text-slate-500 dark:text-slate-450 leading-normal">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>
                        Los cambios de seguridad aplicados en este panel se sincronizan de inmediato y afectan los pagos asociados a tu cuenta.
                      </span>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
