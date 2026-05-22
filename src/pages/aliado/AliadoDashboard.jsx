import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import MapaAliados from "../../components/MapaAliados";
import { QRCodeSVG } from "qrcode.react";

export default function AliadoDashboard() {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('inicio');
  const [perfil, setPerfil] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTx, setSearchTx] = useState("");

  // Nuevos estados para la pestaña Ajustes (Fase 3)
  const [editUbicacion, setEditUbicacion] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editSector, setEditSector] = useState("Salud");
  const [msgAjustes, setMsgAjustes] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Nuevos estados para Cobro QR (Fase 1)
  const [montoCobro, setMontoCobro] = useState("");
  const [intentId, setIntentId] = useState("");
  const [cobroGenerado, setCobroGenerado] = useState(false);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [estadoPago, setEstadoPago] = useState("pendiente");
  const [activeUnsub, setActiveUnsub] = useState(null);

  const themeStyles = {
    bg: theme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBg: theme === "dark" ? "#1E293B" : "#fff",
    border: theme === "dark" ? "#334155" : "#E2E8F0",
    text: theme === "dark" ? "#f8fafc" : "#1E293B",
    textMuted: theme === "dark" ? "#94A3B8" : "#64748B",
    sidebarBg: theme === "dark" ? "#1E293B" : "#fff",
    headerBg: "#0F172A",
  };

  const loadData = async () => {
    try {
      // 1. Cargar Perfil de Aliado
      const aSnap = await getDocs(query(collection(db, "aliados"), where("correo", "==", currentUser.email)));
      let aliadoDoc = aSnap.docs[0]?.data();
      let docId = aSnap.docs[0]?.id;

      if (!aliadoDoc) {
        aliadoDoc = { 
          nombre: "Comercio Asociado", 
          correo: currentUser.email, 
          nit: "900-123-456-7", 
          sector: "Salud", 
          ubicacion: "Avenida Principal # 12-34",
          activo: true 
        };
      } else {
        setPerfilId(docId);
        let updates = {};
        // Generar llave única si no existe
        if (!aliadoDoc.llave) {
          const generatedLlave = "VT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
          updates.llave = generatedLlave;
          aliadoDoc.llave = generatedLlave;
        }
        // Inicializar saldo en Firestore si no existe
        if (aliadoDoc.saldo === undefined) {
          updates.saldo = 0;
          aliadoDoc.saldo = 0;
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, "aliados", docId), updates);
        }
        aliadoDoc = { id: docId, ...aliadoDoc };
      }
      setPerfil(aliadoDoc);
      setEditUbicacion(aliadoDoc.ubicacion || "");
      setEditTelefono(aliadoDoc.telefono || "");
      setEditSector(aliadoDoc.sector || "Salud");

      // 2. Cargar Transacciones recibidas por el aliado (filtrar donde comercio === nombre del aliado)
      const tSnap = await getDocs(collection(db, "transacciones"));
      const txs = tSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.comercio === aliadoDoc.nombre);
      
      // Ordenar por fecha descendente
      const sortedTxs = txs.sort((a, b) => {
        const dateA = a.fecha?.toDate?.() || new Date(a.fecha) || 0;
        const dateB = b.fecha?.toDate?.() || new Date(b.fecha) || 0;
        return dateB - dateA;
      });
      setTransacciones(sortedTxs);
      
      setLoading(false);
    } catch (err) {
      console.error("Error cargando datos del aliado:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      if (activeUnsub) {
        activeUnsub();
      }
    };
  }, [activeUnsub]);

  const reproducirChimeExito = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, startTime);
        osc.type = "sine";
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      playTone(659.25, now, 0.3); // E5
      playTone(880.00, now + 0.15, 0.5); // A5
    } catch (e) {
      console.error("Web Audio API error:", e);
    }
  };

  const handleResetCobro = () => {
    if (activeUnsub) {
      activeUnsub();
      setActiveUnsub(null);
    }
    setMontoCobro("");
    setIntentId("");
    setCobroGenerado(false);
    setEstadoPago("pendiente");
  };

  const handleTabChange = (newTab) => {
    if (newTab !== 'cobrar') {
      handleResetCobro();
    }
    setTab(newTab);
  };

  const handleGenerarCobro = async (e) => {
    e.preventDefault();
    const montoNum = Number(montoCobro);
    if (!montoNum || montoNum <= 0) return;
    
    setGenerandoQR(true);
    try {
      // 1. Crear documento en intentos_pago
      const docRef = await addDoc(collection(db, "intentos_pago"), {
        comercioId: perfilId,
        comercioNombre: perfil.nombre,
        comercioSector: perfil.sector || "Otro",
        monto: montoNum,
        estado: "pendiente",
        creadoEn: new Date()
      });

      setIntentId(docRef.id);
      setCobroGenerado(true);
      setEstadoPago("pendiente");

      // 2. Escucha activa (onSnapshot)
      const unsub = onSnapshot(doc(db, "intentos_pago", docRef.id), (docSnap) => {
        if (docSnap.exists() && docSnap.data().estado === "completado") {
          setEstadoPago("completado");
          reproducirChimeExito();
          loadData(); // actualiza saldo e historial
          unsub();
        }
      });
      setActiveUnsub(() => unsub);
    } catch (err) {
      console.error("Error generando intención de cobro:", err);
    } finally {
      setGenerandoQR(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDescargarQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(perfil?.llave || '')}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = qrUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR-${perfil?.nombre || "Comercio"}.png`;
      link.href = dataUrl;
      link.click();
    };
  };

  const handleGuardarAjustes = async (e) => {
    e.preventDefault();
    setMsgAjustes("");
    setGuardando(true);
    try {
      if (perfilId) {
        await updateDoc(doc(db, "aliados", perfilId), {
          ubicacion: editUbicacion.trim(),
          telefono: editTelefono.trim(),
          sector: editSector
        });
        // Actualizar perfil local
        setPerfil(prev => ({
          ...prev,
          ubicacion: editUbicacion.trim(),
          telefono: editTelefono.trim(),
          sector: editSector
        }));
        setMsgAjustes("Ajustes guardados con éxito.");
      } else {
        setMsgAjustes("Error: No se pudo identificar el ID del perfil.");
      }
    } catch (err) {
      console.error("Error guardando ajustes:", err);
      setMsgAjustes("Ocurrió un error al guardar los ajustes.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', fontFamily: 'inherit' }}>Cargando portal de comercio...</div>;

  const btn = (id, label) => (
    <button 
      onClick={() => handleTabChange(id)} 
      style={{
        background: tab === id ? '#06B6D4' : themeStyles.sidebarBg,
        color: tab === id ? '#fff' : themeStyles.text,
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid ' + themeStyles.border,
        cursor: 'pointer',
        fontWeight: 600,
        textAlign: 'left',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </button>
  );

  const formatDate = (fecha) => {
    if (!fecha) return "—";
    const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Filtrado de transacciones para el buscador
  const filteredTxs = transacciones.filter(t => 
    t.usuarioNombre?.toLowerCase().includes(searchTx.toLowerCase()) || 
    t.categoria?.toLowerCase().includes(searchTx.toLowerCase())
  );

  // Cálculos estadísticos
  const ventasTotal = transacciones.reduce((acc, t) => acc + (t.monto || 0), 0);
  const promedioVenta = transacciones.length ? Math.round(ventasTotal / transacciones.length) : 0;
  
  const hoy = new Date();
  const ventasHoy = transacciones
    .filter(t => {
      const tFecha = t.fecha?.toDate ? t.fecha.toDate() : new Date(t.fecha);
      return tFecha.toDateString() === hoy.toDateString();
    })
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  // Clientes únicos
  const clientesUnicos = [...new Set(transacciones.map(t => t.usuarioNombre))];

  return (
    <div style={{ minHeight: "100vh", background: themeStyles.bg, color: themeStyles.text, fontFamily: "'Inter', system-ui, sans-serif", transition: "background 0.2s" }}>
      
      {/* Barra Superior - Encabezado Institucional del Comercio */}
      <div style={{ background: '#0F172A', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: "22px" }}>🏪</span>
          <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Syne', fontWeight: 800 }}>VittaCard Comercio</h2>
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
          <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 'bold' }}>{perfil?.nombre}</span>
          <button 
            onClick={handleLogout} 
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
        <aside style={{ width: '240px', background: themeStyles.sidebarBg, minHeight: 'calc(100vh - 60px)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid ' + themeStyles.border }}>
          <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid ' + themeStyles.border }}>
            <p style={{ margin: 0, color: themeStyles.textMuted, fontSize: '11px', textTransform: 'uppercase' }}>NIT: {perfil?.nit}</p>
            <p style={{ margin: '2px 0 0', fontWeight: 'bold', fontSize: '14px', color: themeStyles.text }}>{perfil?.nombre}</p>
          </div>
          {btn('inicio', '🏠 Inicio')}
          {btn('cobrar', '💸 Cobro QR')}
          {btn('ventas', '📈 Ventas')}
          {btn('clientes', '👥 Clientes')}
          {btn('transacciones', '💳 Transacciones')}
          {btn('mapa-red', '🗺️ Red de Aliados')}
          {btn('perfil', '🏪 Perfil')}
          {btn('ajustes', '⚙️ Ajustes')}
        </aside>

        {/* Contenido Principal */}
        <main style={{ flex: 1, padding: '24px' }}>
          <div className="card" style={{ background: themeStyles.cardBg, color: themeStyles.text, padding: '28px', borderRadius: '20px', transition: "background 0.2s" }}>
            
            {/* 🏠 PESTAÑA INICIO: CÓDIGO QR DESTACADO + TRANSACCIONES RECIENTES */}
            {tab === 'inicio' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ margin: 0, fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>Panel de Comercio</h1>
                  <p style={{ color: themeStyles.textMuted, marginTop: '4px' }}>Bienvenido. Aquí puedes recibir pagos y gestionar tus ventas.</p>
                </div>

                {/* Panel de Métricas Comerciales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div className="card" style={{ borderTop: "4px solid #06B6D4", background: themeStyles.cardBg, padding: '20px', borderRadius: '12px', border: '1px solid ' + themeStyles.border, borderTopWidth: '4px' }}>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted }}>Saldo en Cuenta</div>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, marginTop: "4px", color: '#06B6D4' }}>${(perfil?.saldo || 0).toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #10B981", background: themeStyles.cardBg, padding: '20px', borderRadius: '12px', border: '1px solid ' + themeStyles.border, borderTopWidth: '4px' }}>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted }}>Ventas de hoy</div>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>${ventasHoy.toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #7C3AED", background: themeStyles.cardBg, padding: '20px', borderRadius: '12px', border: '1px solid ' + themeStyles.border, borderTopWidth: '4px' }}>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted }}>Ingresos Totales</div>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>${ventasTotal.toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #F59E0B", background: themeStyles.cardBg, padding: '20px', borderRadius: '12px', border: '1px solid ' + themeStyles.border, borderTopWidth: '4px' }}>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted }}>Transacciones</div>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, marginTop: "4px" }}>{transacciones.length}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                  {/* Código QR Destacado para recibir pagos */}
                  <div style={{
                    border: '1px solid ' + themeStyles.border, borderRadius: '16px', padding: '24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: theme === "dark" ? "#0f172a" : "#F8FAFC", textAlign: 'center'
                  }}>
                    <span style={{ background: '#E0F2FE', color: '#0369a1', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '14px' }}>
                      PUNTO DE PAGO VITTACARD
                    </span>
                    <h3 style={{ fontFamily: 'Syne', fontSize: '18px', margin: '0 0 16px' }}>Código QR de Cobro</h3>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(perfil?.llave || '')}`}
                      alt="Código QR del Comercio" 
                      style={{ border: '4px solid #fff', borderRadius: '8px', width: '150px', height: '150px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    />
                    <button
                      onClick={handleDescargarQR}
                      style={{
                        marginTop: '16px',
                        background: '#06B6D4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.target.style.background = '#0891B2'}
                      onMouseLeave={e => e.target.style.background = '#06B6D4'}
                    >
                      Descargar mi QR 📥
                    </button>
                    <p style={{ fontSize: '12px', color: themeStyles.textMuted, marginTop: '16px', maxWidth: '300px', lineHeight: 1.4 }}>
                      Los clientes pueden escanear este código QR con sus dispositivos móviles para transferir fondos directamente a este negocio usando la llave.
                    </p>
                    <div style={{ marginTop: '12px', background: theme === "dark" ? "#334155" : "#E2E8F0", color: themeStyles.text, padding: '6px 12px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 'bold' }}>
                      Llave Comercio: {perfil?.llave || "VT-000000"}
                    </div>
                  </div>

                  {/* Resumen de Transferencias Recientes */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: '18px', marginBottom: '14px' }}>Pagos Recibidos Recientemente</h3>
                    <div style={{ border: '1px solid ' + themeStyles.border, borderRadius: '12px', overflow: 'hidden', flex: 1 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: theme === "dark" ? "#1e293b" : "#F8FAFC", borderBottom: '1px solid ' + themeStyles.border, textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: themeStyles.textMuted }}>Cliente</th>
                            <th style={{ padding: '12px', color: themeStyles.textMuted }}>Monto</th>
                            <th style={{ padding: '12px', color: themeStyles.textMuted }}>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transacciones.slice(0, 5).map((t, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid ' + (theme === "dark" ? "#334155" : "#F1F5F9") }}>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{t.usuarioNombre}</td>
                              <td style={{ padding: '12px', fontWeight: 700, color: '#10B981' }}>+${t.monto?.toLocaleString()}</td>
                              <td style={{ padding: '12px', color: themeStyles.textMuted }}>{formatDate(t.fecha)}</td>
                            </tr>
                          ))}
                          {transacciones.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>No se han recibido transferencias aún.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 💸 PESTAÑA COBRO QR */}
            {tab === 'cobrar' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ margin: 0, fontFamily: 'Syne', fontSize: '28px', fontWeight: 800 }}>Cobro QR en Tiempo Real</h1>
                  <p style={{ color: themeStyles.textMuted, marginTop: '4px' }}>Genera códigos QR de cobro instantáneo para tus clientes de VittaCard.</p>
                </div>

                {!cobroGenerado ? (
                  <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
                    <form onSubmit={handleGenerarCobro} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="card" style={{ background: theme === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#fff', border: '1px solid ' + themeStyles.border }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: themeStyles.text }}>
                          Monto a cobrar ($)
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Ej: 50000"
                          value={montoCobro}
                          onChange={(e) => setMontoCobro(e.target.value)}
                          required
                          min="100"
                          style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            padding: '12px',
                            textAlign: 'center',
                            color: '#06B6D4'
                          }}
                        />
                        <p style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '8px', textAlign: 'center' }}>
                          Se cobrará el monto exacto ingresado. El usuario confirmará la transacción.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={generandoQR}
                        style={{
                          background: '#06B6D4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '14px 24px',
                          cursor: generandoQR ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '15px',
                          boxShadow: '0 4px 12px rgba(6,182,212,0.2)',
                          transition: 'all 0.2s',
                          opacity: generandoQR ? 0.7 : 1
                        }}
                      >
                        {generandoQR ? 'Generando código...' : 'Generar Cobro 💸'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '20px' }}>
                    {estadoPago === 'pendiente' ? (
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                        padding: '30px', borderRadius: '20px', border: '1px solid ' + themeStyles.border,
                        background: theme === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)', maxWidth: '400px', width: '100%', textAlign: 'center'
                      }}>
                        <span style={{
                          background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4',
                          padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                        }}>
                          ESPERANDO ESCANEO...
                        </span>
                        
                        <div style={{
                          padding: '16px', background: 'white', borderRadius: '16px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                        }}>
                          <QRCodeSVG value={intentId} size={220} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
                          <span style={{ fontSize: '13px', color: themeStyles.textMuted }}>
                            Cobro de: <strong>${Number(montoCobro).toLocaleString()}</strong>
                          </span>
                        </div>

                        <div style={{ 
                          marginTop: '8px', background: theme === "dark" ? "#1e293b" : "#f1f5f9", 
                          padding: '8px 12px', borderRadius: '10px', width: '100%'
                        }}>
                          <p style={{ margin: 0, fontSize: '11px', color: themeStyles.textMuted }}>ID del Intento (Simulación/Dev):</p>
                          <code style={{ fontSize: '12px', fontWeight: 'bold', color: theme === "dark" ? "#e2e8f0" : "#1e293b", wordBreak: 'break-all' }}>
                            {intentId}
                          </code>
                        </div>

                        <button
                          onClick={handleResetCobro}
                          style={{
                            marginTop: '10px',
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '12px',
                            width: '100%',
                            transition: 'all 0.15s'
                          }}
                        >
                          Cancelar Cobro ❌
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                        padding: '40px', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(209, 250, 229, 0.4)',
                        backdropFilter: 'blur(10px)', maxWidth: '400px', width: '100%', textAlign: 'center',
                        animation: 'fadeIn 0.5s ease'
                      }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '50%',
                          background: '#10B981', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>

                        <h2 style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 800, color: '#10B981', margin: 0 }}>
                          ¡Pago Recibido!
                        </h2>

                        <p style={{ fontSize: '15px', color: themeStyles.text, margin: 0 }}>
                          Se han abonado <strong>${Number(montoCobro).toLocaleString()}</strong> a tu cuenta de aliado comercial.
                        </p>

                        <button
                          onClick={handleResetCobro}
                          style={{
                            marginTop: '10px',
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                            width: '100%',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.15s'
                          }}
                        >
                          Nuevo Cobro 💸
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 📈 PESTAÑA VENTAS */}
            {tab === 'ventas' && (
              <div>
                <h1 style={{ fontFamily: "Syne", fontSize: "26px", marginBottom: "10px" }}>Resumen de Ventas</h1>
                <p style={{ color: themeStyles.textMuted, marginBottom: "20px" }}>Visualiza el crecimiento de tus ingresos recibidos por VittaCard</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div className="card" style={{ borderLeft: '4px solid #10B981', background: theme === "dark" ? "#0f172a" : "#F8FAFC" }}>
                    <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>Ventas del mes</span>
                    <h2 style={{ fontSize: '28px', color: themeStyles.text, margin: '4px 0 0' }}>${ventasTotal.toLocaleString()}</h2>
                  </div>
                  <div className="card" style={{ borderLeft: '4px solid #6366F1', background: theme === "dark" ? "#0f172a" : "#F8FAFC" }}>
                    <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>Transacciones exitosas</span>
                    <h2 style={{ fontSize: '28px', color: themeStyles.text, margin: '4px 0 0' }}>{transacciones.length}</h2>
                  </div>
                </div>
              </div>
            )}

            {/* 👥 PESTAÑA CLIENTES */}
            {tab === 'clientes' && (
              <div>
                <h1 style={{ fontFamily: "Syne", fontSize: "26px", marginBottom: "10px" }}>Clientes</h1>
                <p style={{ color: themeStyles.textMuted, marginBottom: "20px" }}>Listado de usuarios que han realizado transacciones en tu establecimiento</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clientesUnicos.map((cliente, i) => {
                    const comprasCliente = transacciones.filter(t => t.usuarioNombre === cliente);
                    const totalGasto = comprasCliente.reduce((sum, t) => sum + (t.monto || 0), 0);
                    return (
                      <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{cliente}</h4>
                          <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>{comprasCliente.length} transacciones registradas</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 'bold' }}>Total gastado: ${totalGasto.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                  {clientesUnicos.length === 0 && (
                    <p style={{ color: themeStyles.textMuted, textAlign: 'center', padding: '24px' }}>No hay clientes registrados.</p>
                  )}
                </div>
              </div>
            )}

            {/* 💳 PESTAÑA TRANSACCIONES: HISTORIAL COMPLETO + BUSCADOR + ESTADÍSTICAS DEL NEGOCIO */}
            {tab === 'transacciones' && (
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h1 style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>Historial de Transacciones Recibidas</h1>
                  <p style={{ color: themeStyles.textMuted, marginTop: "4px" }}>Consulta y filtra todas las ventas procesadas por tu comercio</p>
                </div>

                {/* Tarjetas de Estadística de Comercio */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                  <div className="card" style={{ borderTop: "4px solid #00B4B4" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800 }}>{transacciones.length}</div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Cantidad de pagos</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #7C3AED" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800 }}>${ventasTotal.toLocaleString()}</div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Ingresos totales</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #F59E0B" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800 }}>
                      ${promedioVenta.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Ticket promedio</div>
                  </div>
                </div>

                {/* Caja de búsqueda */}
                <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
                  <input
                    className="input-field"
                    placeholder="🔍  Buscar por cliente, categoría..."
                    value={searchTx}
                    onChange={e => setSearchTx(e.target.value)}
                    style={{ maxWidth: "400px" }}
                  />
                </div>

                {/* Tabla completa de cobros */}
                <div className="card">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme === "dark" ? "#1e293b" : "#F3F4F6", borderBottom: "2px solid " + themeStyles.border }}>
                        {["Cliente", "Categoría", "Monto Recibido", "Fecha", "Estado"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", color: themeStyles.textMuted, fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map((tx, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid " + (theme === "dark" ? "#334155" : "#F9FAFB") }}>
                          <td style={{ padding: "14px", fontWeight: 600, fontSize: "13px" }}>{tx.usuarioNombre}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#EBE9FE", color: theme === "dark" ? "#fff" : "#6D28D9", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                              {tx.categoria}
                            </span>
                          </td>
                          <td style={{ padding: "14px", fontFamily: "Syne", fontWeight: 800, color: "#10B981" }}>
                            +${tx.monto?.toLocaleString()}
                          </td>
                          <td style={{ padding: "14px", fontSize: "12px", color: themeStyles.textMuted }}>{formatDate(tx.fecha)}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ background: "#D1FAE5", color: "#059669", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                              ✓ {tx.estado || "completada"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredTxs.length === 0 && (
                    <p style={{ textAlign: "center", color: themeStyles.textMuted, padding: "32px", fontSize: "14px" }}>
                      No se encontraron transacciones en el historial.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 🏪 PESTAÑA PERFIL */}
            {tab === 'perfil' && (
              <div>
                <h1 style={{ fontFamily: "Syne", fontSize: "26px", marginBottom: "10px" }}>Perfil del Establecimiento</h1>
                <p style={{ color: themeStyles.textMuted, marginBottom: "20px" }}>Detalles y configuración de tu marca aliada VittaCard</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', marginTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>Nombre del negocio</label>
                    <input className="input-field" value={perfil?.nombre} readOnly style={{ background: theme === "dark" ? "#1e293b" : "#F1F5F9", color: themeStyles.text, cursor: 'not-allowed', borderColor: themeStyles.border }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>NIT</label>
                    <input className="input-field" value={perfil?.nit} readOnly style={{ background: theme === "dark" ? "#1e293b" : "#F1F5F9", color: themeStyles.text, cursor: 'not-allowed', borderColor: themeStyles.border }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>Sector Comercial</label>
                    <input className="input-field" value={perfil?.sector} readOnly style={{ background: theme === "dark" ? "#1e293b" : "#F1F5F9", color: themeStyles.text, cursor: 'not-allowed', borderColor: themeStyles.border }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>Ubicación</label>
                    <input className="input-field" value={perfil?.ubicacion} readOnly style={{ background: theme === "dark" ? "#1e293b" : "#F1F5F9", color: themeStyles.text, cursor: 'not-allowed', borderColor: themeStyles.border }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>Llave Única de Comercio</label>
                    <input className="input-field" value={perfil?.llave} readOnly style={{ background: theme === "dark" ? "#1e293b" : "#F1F5F9", color: themeStyles.text, cursor: 'not-allowed', borderColor: themeStyles.border }} />
                  </div>
                </div>
              </div>
            )}

            {/* ⚙️ PESTAÑA AJUSTES */}
            {tab === 'ajustes' && (
              <div>
                <h1 style={{ fontFamily: "Syne", fontSize: "26px", marginBottom: "10px" }}>Ajustes del Establecimiento</h1>
                <p style={{ color: themeStyles.textMuted, marginBottom: "20px" }}>Actualiza la información pública y comercial de tu comercio</p>
                
                <form onSubmit={handleGuardarAjustes} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', marginTop: '20px' }}>
                  {msgAjustes && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "7px",
                      background: msgAjustes.includes("con éxito") ? "rgba(16,185,129,0.15)" : "rgba(220,38,38,0.15)",
                      border: msgAjustes.includes("con éxito") ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(220,38,38,0.35)",
                      color: msgAjustes.includes("con éxito") ? "#34D399" : "#FCA5A5",
                      fontSize: "13px",
                    }}>
                      {msgAjustes}
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Dirección Completa</label>
                    <input 
                      className="input-field" 
                      value={editUbicacion} 
                      onChange={e => setEditUbicacion(e.target.value)} 
                      required
                      style={{ background: themeStyles.cardBg, color: themeStyles.text, borderColor: themeStyles.border }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Teléfono Comercial</label>
                    <input 
                      className="input-field" 
                      value={editTelefono} 
                      onChange={e => setEditTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                      required
                      style={{ background: themeStyles.cardBg, color: themeStyles.text, borderColor: themeStyles.border }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600, display: 'block', marginBottom: '6px' }}>Categoría del Negocio (Sector)</label>
                    <select
                      className="input-field"
                      value={editSector}
                      onChange={e => setEditSector(e.target.value)}
                      required
                      style={{ background: themeStyles.cardBg, color: themeStyles.text, borderColor: themeStyles.border }}
                    >
                      <option value="Salud" style={{ color: "#1e293b" }}>Salud</option>
                      <option value="Deporte" style={{ color: "#1e293b" }}>Deporte</option>
                      <option value="Supermercado" style={{ color: "#1e293b" }}>Supermercado</option>
                      <option value="Restaurante" style={{ color: "#1e293b" }}>Restaurante</option>
                      <option value="Tecnología" style={{ color: "#1e293b" }}>Tecnología</option>
                      <option value="Ropa" style={{ color: "#1e293b" }}>Ropa</option>
                      <option value="Otro" style={{ color: "#1e293b" }}>Otro</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={guardando}
                    style={{
                      background: '#06B6D4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: guardando ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      alignSelf: 'flex-start',
                      transition: 'background 0.15s',
                      opacity: guardando ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!guardando) e.target.style.background = '#0891B2'; }}
                    onMouseLeave={e => { if (!guardando) e.target.style.background = '#06B6D4'; }}
                  >
                    {guardando ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="31.4" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 🗺️ PESTAÑA RED DE ALIADOS */}
            {tab === 'mapa-red' && (
              <div>
                <h1 style={{ fontFamily: "Syne", fontSize: "26px", marginBottom: "10px" }}>Red de Aliados de Popayán</h1>
                <p style={{ color: themeStyles.textMuted, marginBottom: "20px" }}>Descubre otros aliados en Popayán y visualiza el sector de tu negocio</p>
                <MapaAliados rol="aliado" currentAlly={perfil} />
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
