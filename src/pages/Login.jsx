import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";

// ─── Integrantes del proyecto ────────────────────────────────────────────────
const INTEGRANTES = [
  { nombre: "Juan Esteban Salamanca Vanegas",   rol: "Desarrollador · Ingeniería de Software" },
  { nombre: "Luis Mario Marquez Esterilla",      rol: "Desarrollador · Ingeniería de Software" },
  { nombre: "Cristian Fernando Alzate Calvache", rol: "Desarrollador · Ingeniería de Software" },
];

// ─── Roles disponibles ───────────────────────────────────────────────────────
const ROLES = [
  { id: "admin",   etiqueta: "Administrador",   color: "#1e3a5f" },
  { id: "usuario", etiqueta: "Usuario",          color: "#0369a1" },
  { id: "aliado",  etiqueta: "Aliado Comercial", color: "#4338ca" },
];

// Función para formatear NIT en tiempo real (9 dígitos, guion, 1 dígito)
const formatearNit = (val) => {
  const soloNumeros = val.replace(/\D/g, "");
  if (soloNumeros.length <= 9) {
    return soloNumeros;
  }
  return `${soloNumeros.slice(0, 9)}-${soloNumeros.slice(9, 10)}`;
};

export default function Login() {
  const [rol,         setRol]         = useState("admin");
  const [correo,      setCorreo]      = useState("");
  const [contrasena,  setContrasena]  = useState("");
  const [nombre,      setNombre]      = useState("");
  const [esRegistro,  setEsRegistro]  = useState(false);
  const [error,       setError]       = useState("");
  const [cargando,    setCargando]    = useState(false);
  const [modalEquipo, setModalEquipo] = useState(false);

  // Nuevos estados para registro dinámico (Fase 3)
  const [nombres,     setNombres]     = useState("");
  const [apellidos,   setApellidos]   = useState("");
  const [cc,          setCc]          = useState("");
  const [telefono,    setTelefono]    = useState("");
  const [nit,         setNit]         = useState("");
  const [categoria,   setCategoria]   = useState("Salud");
  const [direccion,   setDireccion]   = useState("");
  const [verContrasena, setVerContrasena] = useState(false);

  const { login, register, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Capturar estado enviado desde la Landing Page
  useEffect(() => {
    if (location.state) {
      if (location.state.esRegistro !== undefined) {
        setEsRegistro(location.state.esRegistro);
      }
      if (location.state.rol !== undefined) {
        setRol(location.state.rol);
      }
    }
  }, [location.state]);

  const modoOscuro = theme === "dark";

  const rolActivo = ROLES.find(r => r.id === rol);

  // ─── Paleta de colores según modo ───────────────────────────────────────
  const c = {
    overlay:     modoOscuro ? "rgba(10,20,40,0.88)" : "rgba(15,35,65,0.82)",
    texto:       "#ffffff",
    textoSub:    "rgba(255,255,255,0.60)",
    inputFondo:  modoOscuro ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)",
    inputBorde:  "rgba(255,255,255,0.20)",
    inputFocus:  "rgba(255,255,255,0.55)",
    modalFondo:  modoOscuro ? "#1e293b" : "#ffffff",
    modalTexto:  modoOscuro ? "#f1f5f9" : "#1e293b",
    modalSub:    modoOscuro ? "#94a3b8" : "#64748b",
    modalBorde:  modoOscuro ? "#334155" : "#e2e8f0",
    botonModo:   modoOscuro ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.18)",
  };

  // ─── Estilo de input ─────────────────────────────────────────────────────
  const estiloInput = {
    width: "100%", padding: "11px 14px",
    borderRadius: "7px",
    border: `1.5px solid ${c.inputBorde}`,
    background: c.inputFondo,
    color: "#ffffff", fontSize: "13.5px",
    boxSizing: "border-box", outline: "none",
    fontFamily: "inherit", transition: "border-color 0.2s",
    backdropFilter: "blur(4px)",
  };

  // ─── Guardar usuario/aliado en Firestore al registrarse ──────────────────
  const guardarEnFirestore = async (uid, correo, rol) => {
    if (rol === "usuario") {
      const existe = await getDocs(query(collection(db, "usuarios"), where("correo", "==", correo)));
      if (existe.empty) {
        const generatedLlave = "VT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
        const generatedCuenta = "5200-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(1000 + Math.random() * 9000);
        await addDoc(collection(db, "usuarios"), {
          uid,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          cc: cc.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          planId: "essential",
          cuenta: generatedCuenta,
          activo: true,
          saldo: 150000,
          llave: generatedLlave,
          creadoEn: new Date(),
        });
      }
    } else if (rol === "aliado") {
      const existe = await getDocs(query(collection(db, "aliados"), where("correo", "==", correo)));
      if (existe.empty) {
        const generatedLlave = "VT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
        await addDoc(collection(db, "aliados"), {
          uid,
          nombre: nombre.trim(),
          nit: nit.trim(),
          sector: categoria,
          ubicacion: direccion.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          activo: true,
          llave: generatedLlave,
          creadoEn: new Date(),
        });
      }
    }
  };

  // ─── Manejar envío del formulario ────────────────────────────────────────
  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      if (esRegistro) {
        // Registro nuevo
        let nombreParaAuth = nombre;
        if (rol === "usuario") {
          nombreParaAuth = `${nombres} ${apellidos}`;
        }
        const credencial = await register(correo, contrasena, nombreParaAuth, rol);
        const uid = credencial.user.uid;
        if (rol !== "admin") {
          await guardarEnFirestore(uid, correo, rol);
        }
      } else {
        // Inicio de sesión
        const cred = await login(correo, contrasena);
        const uid = cred.user.uid;

        // VALIDACIÓN DE ROL ESTRICTA (Fase 3)
        if (rol === "admin") {
          const snap = await getDoc(doc(db, "admins", uid));
          if (!snap.exists()) {
            await logout();
            throw new Error("Acceso denegado: Credenciales no válidas para este tipo de cuenta");
          }
        } else if (rol === "usuario") {
          const snap = await getDocs(query(collection(db, "usuarios"), where("correo", "==", correo)));
          if (snap.empty) {
            await logout();
            throw new Error("Acceso denegado: Credenciales no válidas para este tipo de cuenta");
          }
        } else if (rol === "aliado") {
          const snap = await getDocs(query(collection(db, "aliados"), where("correo", "==", correo)));
          if (snap.empty) {
            await logout();
            throw new Error("Acceso denegado: Credenciales no válidas para este tipo de cuenta");
          }
        }
      }

      // Redirigir según rol seleccionado
      const destino =
        rol === "admin"  ? "/dashboard" :
        rol === "aliado" ? "/aliado/dashboard" :
                           "/usuario/dashboard";
      navigate(destino);

    } catch (err) {
      if (err.message && err.message.includes("Acceso denegado")) {
        setError(err.message);
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener mínimo 6 caracteres.");
      } else {
        setError(err.message || "Ocurrió un error. Intente de nuevo.");
      }
    }
    setCargando(false);
  };

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          PANTALLA COMPLETA — fondo con logo FUP
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        {/* Fondo azul oscuro institucional */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(145deg, #0a1628 0%, #0f2a4a 40%, #0a1e3a 100%)",
        }} />

        {/* Logo FUP de fondo — grande, centrado, muy sutil */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Escudo_FUP.png/220px-Escudo_FUP.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            width: "520px", height: "520px",
            objectFit: "contain",
            opacity: 0.055,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "grayscale(100%) brightness(300%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
          onError={e => e.target.style.display = "none"}
        />

        {/* Overlay suave */}
        <div style={{ position: "absolute", inset: 0, background: c.overlay, zIndex: 2 }} />

        {/* ── Botón modo claro/oscuro ── */}
        <button
          onClick={toggleTheme}
          style={{
            position: "absolute", top: "20px", right: "24px", zIndex: 10,
            background: c.botonModo, border: "1px solid rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)", borderRadius: "6px",
            padding: "7px 16px", cursor: "pointer", fontSize: "11.5px",
            fontWeight: 500, fontFamily: "inherit", letterSpacing: "0.2px",
          }}
        >
          {modoOscuro ? "Modo claro" : "Modo oscuro"}
        </button>

        {/* ── Botón equipo de desarrollo — esquina superior izquierda ── */}
        <button
          onClick={() => setModalEquipo(true)}
          style={{
            position: "absolute", top: "20px", left: "32px", zIndex: 10,
            background: "transparent",
            border: "1.5px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.75)", borderRadius: "7px",
            padding: "9px 20px", cursor: "pointer", fontSize: "12px",
            fontWeight: 600, fontFamily: "inherit", letterSpacing: "0.5px",
            textTransform: "uppercase", transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.target.style.background = "rgba(255,255,255,0.12)";
            e.target.style.color = "white";
            e.target.style.borderColor = "rgba(255,255,255,0.5)";
          }}
          onMouseLeave={e => {
            e.target.style.background = "transparent";
            e.target.style.color = "rgba(255,255,255,0.75)";
            e.target.style.borderColor = "rgba(255,255,255,0.25)";
          }}
        >
          Equipo de desarrollo
        </button>

        {/* ── Año — esquina inferior derecha ── */}
        <p style={{
          position: "absolute", bottom: "28px", right: "32px", zIndex: 10,
          color: "rgba(255,255,255,0.30)", fontSize: "11px", margin: 0,
        }}>
          Fundación Universitaria de Popayán · 2024
        </p>

        {/* ════════════════════════════════════════════════════════════════
            CONTENIDO CENTRAL
        ════════════════════════════════════════════════════════════════ */}
        <div style={{
          position: "relative", zIndex: 5,
          display: "flex", flexDirection: "column",
          alignItems: "center", width: "100%", padding: "32px 20px",
        }}>

          {/* Encabezado institucional */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <p style={{
              color: "rgba(255,255,255,0.45)", fontSize: "10px",
              letterSpacing: "3px", textTransform: "uppercase",
              margin: "0 0 10px", fontWeight: 500,
            }}>
              Fundación Universitaria de Popayán
            </p>
            <h1 style={{
              color: "white", fontSize: "32px", fontWeight: 800,
              margin: "0 0 6px", letterSpacing: "-0.5px",
            }}>
              VittaCard CRM
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.40)", fontSize: "13px", margin: 0,
            }}>
              Sistema de Gestión de Relaciones con el Cliente
            </p>
          </div>

          {/* Tarjeta del formulario */}
          <div style={{
            width: "100%", maxWidth: "420px",
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: "14px", padding: "32px",
          }}>

            {/* Título del formulario */}
            <h2 style={{
              color: "white", fontSize: "18px", fontWeight: 700,
              margin: "0 0 4px", letterSpacing: "-0.2px",
            }}>
              {esRegistro ? "Crear cuenta" : "Acceso al sistema"}
            </h2>
            <p style={{ color: c.textoSub, fontSize: "13px", margin: "0 0 24px" }}>
              {esRegistro ? "Complete los datos para registrarse" : "Ingrese sus credenciales para continuar"}
            </p>

            {/* Selector de rol */}
            <p style={{
              color: "rgba(255,255,255,0.40)", fontSize: "10.5px",
              fontWeight: 600, letterSpacing: "1.5px",
              textTransform: "uppercase", margin: "0 0 8px",
            }}>
              Tipo de acceso
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRol(r.id)}
                  style={{
                    flex: 1, padding: "9px 4px", borderRadius: "6px",
                    border: `1.5px solid ${rol === r.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)"}`,
                    background: rol === r.id ? "rgba(255,255,255,0.18)" : "transparent",
                    color: rol === r.id ? "white" : "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontSize: "11.5px", fontWeight: 600,
                    transition: "all 0.15s", fontFamily: "inherit",
                  }}
                >
                  {r.etiqueta}
                </button>
              ))}
            </div>

            {/* Formulario */}
            <form onSubmit={manejarEnvio} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Campos dinámicos de Registro (Fase 3) */}
              {esRegistro && (
                <>
                  {rol === "usuario" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Nombres completos
                        </label>
                        <input
                          type="text" value={nombres} required
                          onChange={e => setNombres(e.target.value)}
                          placeholder="Ej: Carlos Alberto"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Apellidos
                        </label>
                        <input
                          type="text" value={apellidos} required
                          onChange={e => setApellidos(e.target.value)}
                          placeholder="Ej: Pérez Gómez"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Cédula de Ciudadanía (CC)
                        </label>
                        <input
                          type="text" value={cc} required
                          onChange={e => setCc(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Ej: 1061789456"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Teléfono celular
                        </label>
                        <input
                          type="text" value={telefono} required
                          onChange={e => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Ej: 3123456789"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                    </>
                  )}

                  {rol === "aliado" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Nombre del Comercio
                        </label>
                        <input
                          type="text" value={nombre} required
                          onChange={e => setNombre(e.target.value)}
                          placeholder="Ej: Farmacia Medical"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          NIT
                        </label>
                        <input
                          type="text" value={nit} required
                          onChange={e => setNit(formatearNit(e.target.value))}
                          placeholder="Ej: 900123456-1"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Categoría del negocio
                        </label>
                        <select
                          value={categoria} required
                          onChange={e => setCategoria(e.target.value)}
                          style={{ ...estiloInput, color: "#fff", background: c.inputFondo }}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
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
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Dirección Completa
                        </label>
                        <input
                          type="text" value={direccion} required
                          onChange={e => setDireccion(e.target.value)}
                          placeholder="Ej: Calle 5 # 10-25"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                          Teléfono comercial
                        </label>
                        <input
                          type="text" value={telefono} required
                          onChange={e => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Ej: 3001234567"
                          style={estiloInput}
                          onFocus={e => e.target.style.borderColor = c.inputFocus}
                          onBlur={e => e.target.style.borderColor = c.inputBorde}
                        />
                      </div>
                    </>
                  )}

                  {rol === "admin" && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                        Nombres y apellidos
                      </label>
                      <input
                        type="text" value={nombre} required
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Ej: Administrador General"
                        style={estiloInput}
                        onFocus={e => e.target.style.borderColor = c.inputFocus}
                        onBlur={e => e.target.style.borderColor = c.inputBorde}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Correo */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                  Correo electrónico
                </label>
                <input
                  type="email" value={correo} required
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={estiloInput}
                  onFocus={e => e.target.style.borderColor = c.inputFocus}
                  onBlur={e => e.target.style.borderColor = c.inputBorde}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: "6px" }}>
                  Contraseña
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={verContrasena ? "text" : "password"} value={contrasena} required
                    onChange={e => setContrasena(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ ...estiloInput, paddingRight: "40px" }}
                    onFocus={e => e.target.style.borderColor = c.inputFocus}
                    onBlur={e => e.target.style.borderColor = c.inputBorde}
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasena(!verContrasena)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.45)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      outline: "none",
                      transition: "color 0.2s",
                      zIndex: 5,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                  >
                    {verContrasena ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: "7px",
                  background: "rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.35)",
                  color: "#fca5a5", fontSize: "13px",
                }}>
                  {error}
                </div>
              )}

              {/* Botón ingresar */}
              <button
                type="submit" disabled={cargando}
                style={{
                  width: "100%", padding: "12px", borderRadius: "7px",
                  border: "none", background: "rgba(255,255,255,0.92)",
                  color: "#0f2a4a", fontSize: "13.5px", fontWeight: 700,
                  cursor: cargando ? "not-allowed" : "pointer",
                  opacity: cargando ? 0.7 : 1,
                  fontFamily: "inherit", letterSpacing: "0.1px",
                  transition: "all 0.2s", marginTop: "4px",
                }}
              >
                {cargando ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" stroke="rgba(15, 42, 74, 0.2)" strokeDasharray="31.4" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Procesando...</span>
                  </div>
                ) : esRegistro ? (
                  "Crear cuenta"
                ) : (
                  "Ingresar"
                )}
              </button>

              {/* Cambiar login/registro */}
              <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
                {esRegistro ? "¿Ya tiene cuenta?" : "¿No tiene cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => { setEsRegistro(!esRegistro); setError(""); }}
                  style={{
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.85)",
                    cursor: "pointer", fontSize: "13px",
                    fontWeight: 600, padding: 0, fontFamily: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  {esRegistro ? "Iniciar sesión" : "Registrarse"}
                </button>
              </p>
            </form>
          </div>

          {/* Botón Volver al inicio */}
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.45)",
              cursor: "pointer",
              fontSize: "13.5px",
              fontWeight: 500,
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "rgba(255,255,255,0.45)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Regresar al inicio
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — Equipo de desarrollo
      ════════════════════════════════════════════════════════════════════ */}
      {modalEquipo && (
        <div
          onClick={() => setModalEquipo(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(6px)", padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: c.modalFondo, borderRadius: "14px",
              padding: "36px 40px", width: "100%", maxWidth: "430px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
            }}
          >
            {/* Encabezado modal */}
            <p style={{ fontSize: "10px", letterSpacing: "2.5px", textTransform: "uppercase", color: c.modalSub, margin: "0 0 6px" }}>
              Ingeniería de Software · 2026
            </p>
            <h3 style={{ fontSize: "19px", fontWeight: 700, color: c.modalTexto, margin: "0 0 4px" }}>
              Equipo de desarrollo
            </h3>
            <p style={{ fontSize: "13px", color: c.modalSub, margin: "0 0 24px" }}>
              Fundación Universitaria de Popayán — VittaCard CRM
            </p>

            {/* Integrantes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {INTEGRANTES.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 16px",
                  background: modoOscuro ? "#0f172a" : "#f8fafc",
                  borderRadius: "9px",
                  borderLeft: "3px solid #1e3a5f",
                }}>
                  {/* Avatar con iniciales */}
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "#1e3a5f", color: "white", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700,
                  }}>
                    {p.nombre.split(" ").slice(0, 2).map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: c.modalTexto, margin: 0 }}>{p.nombre}</p>
                    <p style={{ fontSize: "11.5px", color: c.modalSub, margin: "2px 0 0" }}>{p.rol}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setModalEquipo(false)}
              style={{
                width: "100%", padding: "11px", borderRadius: "7px",
                border: `1.5px solid ${c.modalBorde}`,
                background: "transparent", color: c.modalSub,
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
                fontFamily: "inherit",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
