import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase/config";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, getDoc, deleteDoc, runTransaction, onSnapshot } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { updatePassword } from "firebase/auth";
import MapaAliados from "../../components/MapaAliados";
import { Store, Activity, Dumbbell, ShoppingCart, Utensils, Pill, MapPin, Phone, CheckCircle, User, FileText, Shield, Sliders, Upload, QrCode, Send, Wallet, ArrowDownToLine, Copy, Eye, EyeOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export default function UsuarioDashboard() {
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [perfil, setPerfil] = useState(null);
  const [perfilId, setPerfilId] = useState(null);
  const [tarjeta, setTarjeta] = useState(null);
  const [verTarjeta, setVerTarjeta] = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [aliados, setAliados] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("membresia"); // Ver planes inmediatamente al iniciar sesión

  useEffect(() => {
    if (location.state?.seccion) {
      setSeccion(location.state.seccion);
    }
  }, [location.state]);

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
    }, (err) => {
      console.error("Error al escuchar la tarjeta en el dashboard:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Estados para Ajustes de Perfil (Fase 3)
  const [subTab, setSubTab] = useState("perfil");
  const [editTelefono, setEditTelefono] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [msgAjustes, setMsgAjustes] = useState("");
  const [errorAjustes, setErrorAjustes] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [vistaComercios, setVistaComercios] = useState("lista");
  const [copiado, setCopiado] = useState(false);

  // Estados de modales
  const [modalEnviar, setModalEnviar] = useState(false);
  const [modalRecargar, setModalRecargar] = useState(false);
  const [modalRecibir, setModalRecibir] = useState(false);
  const [modalEscanearQR, setModalEscanearQR] = useState(false);

  // Estados para Pago QR (Fase 1)
  const [intentIdQR, setIntentIdQR] = useState("");
  const [intentData, setIntentData] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [scanError, setScanError] = useState("");
  const [procesandoPagoQR, setProcesandoPagoQR] = useState(false);

  // Estados de carga (loading spinners)
  const [procesandoPSE, setProcesandoPSE] = useState(false);
  const [enviandoDinero, setEnviandoDinero] = useState(false);
  const [guardandoAjustes, setGuardandoAjustes] = useState(false);

  // Formularios de modales
  const [formEnviar, setFormEnviar] = useState({ destinatario: "", monto: "", categoria: "Otro" });
  const [formRecargar, setFormRecargar] = useState({ monto: "", tarjeta: "5200-XXXX-XXXX-XXXX" });
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorTransaccion, setErrorTransaccion] = useState("");

  // Búsqueda de destinatarios
  const [searchQuery, setSearchQuery] = useState("");
  const [destEncontrado, setDestEncontrado] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [buscando, setBuscando] = useState(false);

  // Búsqueda en historial
  const [searchTx, setSearchTx] = useState("");

  // Estilos de tema dinámicos
  const themeStyles = {
    bg: theme === "dark" ? "#0F172A" : "#F8FAFC",
    cardBg: theme === "dark" ? "#1E293B" : "#fff",
    border: theme === "dark" ? "#334155" : "#E2E8F0",
    text: theme === "dark" ? "#f8fafc" : "#1E293B",
    textMuted: theme === "dark" ? "#94A3B8" : "#64748B",
    sidebarBg: theme === "dark" ? "#1E293B" : "#fff",
    headerBg: "#0F172A",
  };

  const seedAliadosIfNeeded = async (existingAllies) => {
    const hasEstancia = existingAllies.some(a => (a.nombre || "").toLowerCase().includes("estancia"));
    if (hasEstancia) return existingAllies;

    console.log("Seeding realistic allies for Popayán...");
    const mockAllies = [
      {
        nombre: "Clínica La Estancia",
        sector: "Salud",
        nit: "900.123.456-1",
        ubicacion: "Calle 15N # 6-30, Popayán",
        telefono: "602 8331111",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Hospital Universitario San José",
        sector: "Salud",
        nit: "891.500.160-2",
        ubicacion: "Carrera 6 # 10N-142, Popayán",
        telefono: "602 8234321",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Farmatodo Panamericana",
        sector: "Farmacia",
        nit: "900.876.543-3",
        ubicacion: "Carrera 9 # 25N-40, Popayán",
        telefono: "3104523987",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Smart Fit Campanario",
        sector: "Deporte",
        nit: "901.321.654-4",
        ubicacion: "Centro Comercial Campanario, Popayán",
        telefono: "3187654321",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Villas Gym",
        sector: "Deporte",
        nit: "900.456.789-5",
        ubicacion: "Carrera 9 # 18N-22, Popayán",
        telefono: "3216549870",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Nicki Burguer",
        sector: "Restaurante",
        nit: "901.987.654-6",
        ubicacion: "Carrera 8 # 5-42, Centro, Popayán",
        telefono: "3145698712",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Mora Castilla",
        sector: "Restaurante",
        nit: "900.543.210-7",
        ubicacion: "Calle 4 # 7-33, Centro Histórico, Popayán",
        telefono: "3004561234",
        activo: true,
        creadoEn: new Date()
      },
      {
        nombre: "Merca Fruver La 13",
        sector: "Supermercado",
        nit: "891.120.340-8",
        ubicacion: "Carrera 13 # 5-10, Popayán",
        telefono: "3117894562",
        activo: true,
        creadoEn: new Date()
      }
    ];

    // Delete existing placeholder allies (no email associated, i.e. !a.correo)
    const deletePromises = existingAllies
      .filter(a => !a.correo)
      .map(a => deleteDoc(doc(db, "aliados", a.id)));
    
    await Promise.all(deletePromises);

    const addedAllies = [];
    for (const ally of mockAllies) {
      const docRef = await addDoc(collection(db, "aliados"), ally);
      addedAllies.push({ id: docRef.id, ...ally });
    }

    const remainingAllies = existingAllies.filter(a => a.correo);
    return [...remainingAllies, ...addedAllies];
  };

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
        style = {
          ...style,
          background: "#475569",
          color: "#E2E8F0",
          border: "1px solid #64748B",
        };
        text = "Free";
        break;
      case "basico":
        style = {
          ...style,
          background: "rgba(59, 130, 246, 0.15)",
          color: "#60A5FA",
          border: "1px solid rgba(59, 130, 246, 0.4)",
        };
        text = "Básico";
        break;
      case "plus":
        style = {
          ...style,
          background: "rgba(20, 184, 166, 0.15)",
          color: "#2DD4BF",
          border: "1px solid rgba(20, 184, 166, 0.4)",
        };
        text = "Plus";
        break;
      case "premium":
        style = {
          ...style,
          background: "linear-gradient(135deg, #7C3AED 0%, #D97706 100%)",
          color: "#FFFFFF",
          border: "1px solid #F59E0B",
          boxShadow: "0 0 10px rgba(124, 58, 237, 0.6), inset 0 0 4px rgba(255, 255, 255, 0.4)",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)"
        };
        text = "Premium";
        break;
      default:
        style = {
          ...style,
          background: "#475569",
          color: "#E2E8F0",
        };
        text = planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : "Free";
    }

    return (
      <span style={style}>
        {text}
      </span>
    );
  };

  const loadData = async () => {
    try {
      // 1. Cargar Perfil de Usuario
      const uSnap = await getDocs(query(collection(db, "usuarios"), where("correo", "==", currentUser.email)));
      let userDoc = uSnap.docs[0]?.data();
      let docId = uSnap.docs[0]?.id;

      if (!userDoc) {
        userDoc = { 
          nombres: currentUser.email, 
          correo: currentUser.email, 
          planId: "free", 
          cuenta: "5200-9999-8888-7777", 
          activo: true,
          saldo: 150000
        };
      } else {
        setPerfilId(docId);
        
        let updates = {};
        // Inicializar saldo
        if (userDoc.saldo === undefined) {
          updates.saldo = 150000;
          userDoc.saldo = 150000;
        }
        // Generar llave única si no existe
        if (!userDoc.llave) {
          const generatedLlave = "VT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
          updates.llave = generatedLlave;
          userDoc.llave = generatedLlave;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, "usuarios", docId), updates);
        }
      }
      setPerfil(userDoc);
      setEditTelefono(userDoc.telefono || "");

      // 2. Cargar Transacciones del usuario
      const tSnap = await getDocs(collection(db, "transacciones"));
      const txs = tSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.usuarioNombre === userDoc.nombres);
      
      // Ordenar por fecha descendente
      const sortedTxs = txs.sort((a, b) => {
        const dateA = a.fecha?.toDate?.() || new Date(a.fecha) || 0;
        const dateB = b.fecha?.toDate?.() || new Date(b.fecha) || 0;
        return dateB - dateA;
      });
      setTransacciones(sortedTxs);

      // 3. Cargar Planes
      const pSnap = await getDocs(collection(db, "planes"));
      setPlanes(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 4. Cargar destinatarios (usuarios y aliados)
      const otherUsersSnap = await getDocs(collection(db, "usuarios"));
      setUsuarios(otherUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.correo !== currentUser.email));

      const alliesSnap = await getDocs(collection(db, "aliados"));
      const initialAllies = alliesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const finalAllies = await seedAliadosIfNeeded(initialAllies);
      setAliados(finalAllies);

      setLoading(false);
    } catch (err) {
      console.error("Error cargando datos del dashboard:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // Manejo de Scanner QR Lifecycle
  useEffect(() => {
    let scanner = null;
    if (modalEscanearQR && !confirmingPayment && !procesandoPagoQR) {
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (element) {
          scanner = new Html5Qrcode("reader");
          scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              handlePaymentScanned(decodedText);
            },
            (err) => {
              // Non-blocking scan errors
            }
          ).catch((err) => {
            console.error("Error starting camera:", err);
            setScanError("No se pudo iniciar la cámara. Verifica los permisos o usa el Modo Dev.");
          });
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          if (scanner.isScanning) {
            scanner.stop().then(() => {
              scanner.clear();
            }).catch(err => console.error("Error stopping scanner:", err));
          }
        }
      };
    }
  }, [modalEscanearQR, confirmingPayment, procesandoPagoQR]);

  const calcularMontoFinal = (montoOriginal, planId, sector) => {
    const descText = obtenerDescuento(planId);
    const descPct = parseInt(descText.replace("%", ""), 10) || 0;
    const descuento = (montoOriginal * descPct) / 100;
    return {
      descuento,
      montoFinal: Math.max(0, montoOriginal - descuento),
      descText
    };
  };

  const handlePaymentScanned = async (id) => {
    if (!id || !id.trim()) return;
    setProcesandoPagoQR(true);
    setScanError("");
    try {
      const intentSnap = await getDoc(doc(db, "intentos_pago", id.trim()));
      if (!intentSnap.exists()) {
        setScanError("El código QR no corresponde a un cobro válido o expiró.");
        setProcesandoPagoQR(false);
        return;
      }
      const data = intentSnap.data();
      if (data.estado !== "pendiente") {
        setScanError(`Este cobro ya no está disponible (Estado: ${data.estado}).`);
        setProcesandoPagoQR(false);
        return;
      }
      setIntentIdQR(id.trim());
      setIntentData(data);
      setConfirmingPayment(true);
    } catch (err) {
      console.error("Error al procesar QR:", err);
      setScanError("Error al consultar la información del cobro.");
    } finally {
      setProcesandoPagoQR(false);
    }
  };

  const handleConfirmarPagoQR = async () => {
    if (!intentIdQR || !intentData || !perfilId) return;
    setProcesandoPagoQR(true);
    setErrorTransaccion("");
    try {
      const userRef = doc(db, "usuarios", perfilId);
      const intentRef = doc(db, "intentos_pago", intentIdQR);
      const allyRef = doc(db, "aliados", intentData.comercioId);

      const finalMonto = calcularMontoFinal(intentData.monto, perfil.planId, intentData.comercioSector);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        const intentSnap = await transaction.get(intentRef);
        const allySnap = await transaction.get(allyRef);

        if (!userSnap.exists()) throw new Error("El usuario no existe.");
        if (!intentSnap.exists()) throw new Error("El cobro ya no existe.");
        if (!allySnap.exists()) throw new Error("El comercio asociado no existe.");

        if (intentSnap.data().estado !== "pendiente") {
          throw new Error("Este cobro ya fue procesado o cancelado.");
        }

        const currentSaldo = userSnap.data().saldo ?? 0;
        if (currentSaldo < finalMonto.montoFinal) {
          throw new Error("Saldo insuficiente para pagar este cobro.");
        }

        const comisionRate = allySnap.data().comision !== undefined ? allySnap.data().comision : 0.02;
        const comisionMonto = finalMonto.montoFinal * comisionRate;
        const netoComercio = finalMonto.montoFinal - comisionMonto;

        transaction.update(userRef, { saldo: currentSaldo - finalMonto.montoFinal });
        transaction.update(allyRef, { saldo: (allySnap.data().saldo || 0) + netoComercio });

        transaction.update(intentRef, {
          estado: "completado",
          pagadoPor: perfilId,
          pagadoPorNombre: perfil.nombres,
          montoFinal: finalMonto.montoFinal,
          descuentoMonto: finalMonto.descuento,
          comisionMonto: comisionMonto,
          fechaPago: new Date()
        });

        const newTxRef = doc(collection(db, "transacciones"));
        transaction.set(newTxRef, {
          usuarioNombre: perfil.nombres,
          usuarioId: perfilId,
          comercio: intentData.comercioNombre,
          comercioId: intentData.comercioId,
          monto: finalMonto.montoFinal,
          montoOriginal: intentData.monto,
          descuento: finalMonto.descuento,
          comision: comisionMonto,
          categoria: intentData.comercioSector || "Otro",
          fecha: new Date(),
          estado: "completada",
          tipo: "pago_qr",
          intentId: intentIdQR
        });
      });

      setMensajeExito(`¡Pago de $${finalMonto.montoFinal.toLocaleString()} a ${intentData.comercioNombre} procesado con éxito!`);
      setModalEscanearQR(false);
      setIntentIdQR("");
      setIntentData(null);
      setConfirmingPayment(false);
      
      setTimeout(() => setMensajeExito(""), 4000);
      await loadData();
    } catch (err) {
      console.error("Error en la transacción de pago QR:", err);
      setErrorTransaccion(err.message || "Error al procesar el pago.");
      setTimeout(() => setErrorTransaccion(""), 4000);
    } finally {
      setProcesandoPagoQR(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Buscar destinatario por correo o llave única
  const handleBuscarDestinatario = async () => {
    if (!searchQuery.trim()) return;
    setBuscando(true);
    setSearchError("");
    setDestEncontrado(null);

    const term = searchQuery.trim();

    // Validar autotransferencia
    if (term === currentUser.email || term === perfil?.llave) {
      setSearchError("No puedes transferirte a ti mismo.");
      setBuscando(false);
      return;
    }

    try {
      // Buscar en usuarios
      let targetDoc = null;
      const uSnap1 = await getDocs(query(collection(db, "usuarios"), where("correo", "==", term)));
      const uSnap2 = await getDocs(query(collection(db, "usuarios"), where("llave", "==", term)));

      if (!uSnap1.empty) {
        targetDoc = { id: uSnap1.docs[0].id, ...uSnap1.docs[0].data(), tipo: "usuario" };
      } else if (!uSnap2.empty) {
        targetDoc = { id: uSnap2.docs[0].id, ...uSnap2.docs[0].data(), tipo: "usuario" };
      }

      // Si no es usuario, buscar en aliados
      if (!targetDoc) {
        const aSnap1 = await getDocs(query(collection(db, "aliados"), where("correo", "==", term)));
        const aSnap2 = await getDocs(query(collection(db, "aliados"), where("llave", "==", term)));

        if (!aSnap1.empty) {
          targetDoc = { id: aSnap1.docs[0].id, ...aSnap1.docs[0].data(), tipo: "comercio" };
        } else if (!aSnap2.empty) {
          targetDoc = { id: aSnap2.docs[0].id, ...aSnap2.docs[0].data(), tipo: "comercio" };
        }
      }

      if (targetDoc) {
        setDestEncontrado(targetDoc);
        setFormEnviar(prev => ({ ...prev, destinatario: targetDoc.nombres || targetDoc.nombre }));
      } else {
        setSearchError("No se encontró ningún usuario o comercio con esa llave o correo.");
      }
    } catch (err) {
      console.error("Error buscando destinatario:", err);
      setSearchError("Error al buscar en la base de datos.");
    }
    setBuscando(false);
  };

  // Manejar Recarga
  const handleRecargarSubmit = async (e) => {
    e.preventDefault();
    const montoNum = Number(formRecargar.monto);
    if (!montoNum || montoNum <= 0) return;
    setProcesandoPSE(true);
    try {
      if (perfilId) {
        const nuevoSaldo = (perfil.saldo || 0) + montoNum;
        await updateDoc(doc(db, "usuarios", perfilId), { saldo: nuevoSaldo });
        
        await addDoc(collection(db, "transacciones"), {
          usuarioNombre: perfil.nombres,
          comercio: "VittaCard Recarga",
          monto: montoNum,
          categoria: "Alimentos",
          fecha: new Date(),
          estado: "completada"
        });

        setMensajeExito(`¡Recarga exitosa de $${montoNum.toLocaleString()}!`);
        setFormRecargar({ monto: "", tarjeta: "5200-XXXX-XXXX-XXXX" });
        setTimeout(() => setMensajeExito(""), 3000);
        await loadData();
      }
      setModalRecargar(false);
    } catch (err) {
      console.error("Error al recargar:", err);
    } finally {
      setProcesandoPSE(false);
    }
  };

  // Manejar Enviar Dinero
  const handleEnviarSubmit = async (e) => {
    e.preventDefault();
    const montoNum = Number(formEnviar.monto);
    if (!montoNum || montoNum <= 0) return;
    if (!destEncontrado) {
      setErrorTransaccion("Por favor, busca y selecciona un destinatario válido primero.");
      return;
    }
    if (montoNum > (perfil.saldo || 0)) {
      setErrorTransaccion("Saldo insuficiente para realizar esta transacción.");
      setTimeout(() => setErrorTransaccion(""), 4000);
      return;
    }
    setEnviandoDinero(true);
    try {
      if (perfilId) {
        const nuevoSaldo = (perfil.saldo || 0) - montoNum;
        
        // 1. Descontar del saldo del usuario actual
        await updateDoc(doc(db, "usuarios", perfilId), { saldo: nuevoSaldo });

        // 2. Sumar al saldo si es un usuario
        if (destEncontrado.tipo === "usuario" && destEncontrado.id) {
          const saldoDestNuevo = (destEncontrado.saldo || 0) + montoNum;
          await updateDoc(doc(db, "usuarios", destEncontrado.id), { saldo: saldoDestNuevo });
        }

        // 3. Registrar transacción
        await addDoc(collection(db, "transacciones"), {
          usuarioNombre: perfil.nombres,
          comercio: destEncontrado.nombres || destEncontrado.nombre,
          monto: montoNum,
          categoria: formEnviar.categoria,
          fecha: new Date(),
          estado: "completada"
        });

        setMensajeExito(`¡Transferencia de $${montoNum.toLocaleString()} a ${destEncontrado.nombres || destEncontrado.nombre} realizada!`);
        setFormEnviar({ destinatario: "", monto: "", categoria: "Otro" });
        setSearchQuery("");
        setDestEncontrado(null);
        setTimeout(() => setMensajeExito(""), 3000);
        await loadData();
      }
      setModalEnviar(false);
    } catch (err) {
      console.error("Error al enviar dinero:", err);
    } finally {
      setEnviandoDinero(false);
    }
  };

  // Comprar / Cambiar de plan (Auditoría estricta de saldo Fase 3 - Transacción Atómica)
  const handleAdquirirPlan = async (plan) => {
    if (perfil.planId === plan.id) return;
    setErrorTransaccion("");
    setMensajeExito("");

    try {
      if (!perfilId) {
        setErrorTransaccion("Error: ID de perfil no encontrado.");
        setTimeout(() => setErrorTransaccion(""), 4000);
        return;
      }

      const userRef = doc(db, "usuarios", perfilId);
      
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) {
          throw new Error("El usuario no existe en la base de datos.");
        }
        
        const realSaldo = userSnap.data().saldo ?? 0;

        // Validación matemática del saldo en tiempo real
        if (realSaldo < plan.cuota) {
          throw new Error("Saldo insuficiente para adquirir este plan.");
        }

        const nuevoSaldo = realSaldo - plan.cuota;

        // Actualizar saldo y plan
        transaction.update(userRef, {
          saldo: nuevoSaldo,
          planId: plan.id
        });

        // Registrar la transacción
        const transaccionRef = doc(collection(db, "transacciones"));
        transaction.set(transaccionRef, {
          usuarioNombre: perfil.nombres,
          comercio: "Suscripción VittaCard " + plan.nombre,
          monto: plan.cuota,
          categoria: "Servicios",
          fecha: new Date(),
          estado: "completada"
        });
      });

      setMensajeExito(`¡Has adquirido el plan VittaCard ${plan.nombre} exitosamente!`);
      setTimeout(() => setMensajeExito(""), 4000);
      await loadData();
    } catch (err) {
      console.error("Error al adquirir plan:", err);
      setErrorTransaccion(err.message || "Ocurrió un error al procesar el cambio de plan.");
      setTimeout(() => setErrorTransaccion(""), 4000);
    }
  };

  const getCategoriaStyle = (sector) => {
    const s = (sector || "Otro").toLowerCase();
    switch (s) {
      case "salud": return { bg: "bg-teal-50 dark:bg-teal-950/80 border border-teal-200/50 dark:border-teal-900/40", text: "text-teal-700 dark:text-teal-300" };
      case "deporte": return { bg: "bg-violet-50 dark:bg-violet-950/80 border border-violet-200/50 dark:border-violet-900/40", text: "text-violet-700 dark:text-violet-300" };
      case "supermercado": return { bg: "bg-amber-50 dark:bg-amber-950/80 border border-amber-200/50 dark:border-amber-900/40", text: "text-amber-700 dark:text-amber-300" };
      case "restaurante": return { bg: "bg-orange-50 dark:bg-orange-950/80 border border-orange-200/50 dark:border-orange-900/40", text: "text-orange-700 dark:text-orange-300" };
      case "farmacia": return { bg: "bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/50 dark:border-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" };
      case "entretenimiento": return { bg: "bg-blue-50 dark:bg-blue-950/80 border border-blue-200/50 dark:border-blue-900/40", text: "text-blue-700 dark:text-blue-300" };
      default: return { bg: "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/40", text: "text-slate-700 dark:text-slate-300" };
    }
  };

  const obtenerDescuento = (planId) => {
    const plan = (planId || "free").toLowerCase();
    const planObj = planes.find(p => p.id.toLowerCase() === plan);
    if (planObj && planObj.descuento !== undefined) {
      return `${Math.round(planObj.descuento * 100)}%`;
    }
    // Fallbacks si la base de datos aún no cargó
    if (plan === "premium") return "15%";
    if (plan === "plus") return "10%";
    if (plan === "basico") return "5%";
    return "0%";
  };

  const handleGuardarAjustes = async (e) => {
    e.preventDefault();
    setMsgAjustes("");
    setErrorAjustes("");
    setGuardandoAjustes(true);
    try {
      if (perfilId) {
        await updateDoc(doc(db, "usuarios", perfilId), {
          telefono: editTelefono.trim()
        });
        setPerfil(prev => ({ ...prev, telefono: editTelefono.trim() }));
        setMsgAjustes("Teléfono celular actualizado con éxito.");
      }

      if (nuevaContrasena.trim()) {
        if (nuevaContrasena.trim().length < 6) {
          setErrorAjustes("La contraseña debe tener mínimo 6 caracteres.");
          setGuardandoAjustes(false);
          return;
        }
        await updatePassword(auth.currentUser, nuevaContrasena.trim());
        setMsgAjustes(prev => prev ? prev + " Y contraseña actualizada con éxito." : "Contraseña actualizada con éxito.");
        setNuevaContrasena("");
      }
    } catch (err) {
      console.error("Error al guardar ajustes:", err);
      if (err.code === "auth/requires-recent-login") {
        setErrorAjustes("Esta operación requiere que inicies sesión recientemente. Por favor, vuelve a iniciar sesión e intenta de nuevo.");
      } else {
        setErrorAjustes(err.message || "Ocurrió un error al guardar los ajustes.");
      }
    } finally {
      setGuardandoAjustes(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', fontFamily: 'inherit' }}>Cargando portal...</div>;

  // Botón lateral estilizado
  const menuBtn = (id, label) => (
    <button
      onClick={() => {
        if (id === 'tarjetas') {
          navigate('/usuario/tarjetas');
        } else {
          setSeccion(id);
        }
      }}
      style={{
        background: seccion === id ? '#06B6D4' : themeStyles.sidebarBg,
        color: seccion === id ? '#fff' : themeStyles.text,
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

  // Paleta de colores para planes
  const planColors = {
    free: { bg: "#475569", accent: "#64748B", dark: "#334155" },
    basico: { bg: "rgba(59, 130, 246, 0.15)", accent: "#3B82F6", dark: "#1D4ED8" },
    plus: { bg: "rgba(20, 184, 166, 0.15)", accent: "#14B8A6", dark: "#0F766E" },
    premium: { bg: "linear-gradient(135deg, #7C3AED 0%, #D97706 100%)", accent: "#7C3AED", dark: "#5B21B6" }
  };

  // Formatear Fecha
  const formatDate = (fecha) => {
    if (!fecha) return "—";
    const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  // Filtrado de transacciones
  const filteredTxs = transacciones.filter(t => 
    t.comercio?.toLowerCase().includes(searchTx.toLowerCase()) || 
    t.categoria?.toLowerCase().includes(searchTx.toLowerCase())
  );

  // Estadísticas de usuario
  const userVolumenTotal = transacciones.reduce((acc, t) => acc + (t.monto || 0), 0);
  const userPromedioTx = transacciones.length ? Math.round(userVolumenTotal / transacciones.length) : 0;

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
          {mensajeExito && (
            <div style={{
              background: "#D1FAE5", color: "#065F46", padding: "12px 18px", 
              borderRadius: "10px", marginBottom: "16px", fontWeight: 600,
              border: "1px solid #A7F3D0"
            }}>
              {mensajeExito}
            </div>
          )}

          {errorTransaccion && (
            <div style={{
              background: "#FEE2E2", color: "#991B1B", padding: "12px 18px", 
              borderRadius: "10px", marginBottom: "16px", fontWeight: 600,
              border: "1px solid #FCA5A5"
            }}>
              {errorTransaccion}
            </div>
          )}

          <div className="card" style={{ background: themeStyles.cardBg, color: themeStyles.text, padding: '28px', borderRadius: '20px', transition: "background 0.2s" }}>
            
            {/* 🏠 SECCIÓN INICIO */}
            {seccion === 'inicio' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-800/80 pb-6">
                  <div>
                    {/* Saludo con nombre real */}
                    <h1 className="text-3xl font-black font-['Syne'] text-slate-900 dark:text-white leading-tight flex items-center gap-3.5 flex-wrap">
                      Hola, {perfil?.nombres} {getPlanBadge(perfil?.planId)}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bienvenido al portal de usuarios VittaCard.</p>
                  </div>
                  {/* Tarjeta de Cuenta */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl min-w-[250px] shadow-lg border border-slate-850 relative">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tarjeta</span>
                    <div className="flex items-center justify-between mt-1 mb-2">
                      <h4 className="text-sm font-mono text-slate-300 tracking-wider m-0">
                        {tarjeta 
                          ? (verTarjeta 
                              ? `${tarjeta.numero.slice(0, 4)} ${tarjeta.numero.slice(4, 8)} ${tarjeta.numero.slice(8, 12)} ${tarjeta.numero.slice(12, 16)}` 
                              : `${tarjeta.numero.slice(0, 4)} **** **** ${tarjeta.numero.slice(-4)}`)
                          : perfil?.cuenta 
                            ? (perfil.cuenta.includes("X") || perfil.cuenta.includes("*") 
                                ? perfil.cuenta 
                                : `${perfil.cuenta.replace(/-/g, '').slice(0, 4)} **** **** ${perfil.cuenta.replace(/-/g, '').slice(-4)}`) 
                            : "Sin tarjeta asignada"}
                      </h4>
                      {(tarjeta || (perfil?.cuenta && !(perfil.cuenta.includes("X") || perfil.cuenta.includes("*")))) && (
                        <button
                          onClick={() => {
                            if (!verTarjeta) {
                              setVerTarjeta(true);
                              setTimeout(() => setVerTarjeta(false), 10000);
                            } else {
                              setVerTarjeta(false);
                            }
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all outline-none cursor-pointer"
                          title={verTarjeta ? "Ocultar" : "Mostrar (10s)"}
                        >
                          {verTarjeta ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    {tarjeta && (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-3">
                        <div>
                          <span>Vence: </span>
                          <span className="text-slate-200 font-semibold">{tarjeta.vencimiento}</span>
                        </div>
                        <div>
                          <span>CVV: </span>
                          <span className="text-slate-200 font-semibold">{verTarjeta ? tarjeta.cvv : "***"}</span>
                        </div>
                      </div>
                    )}
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Saldo disponible</span>
                    <h2 className="text-2xl font-black text-cyan-400 font-['Syne'] mt-1">
                      ${(perfil?.saldo || 0).toLocaleString()}
                    </h2>
                  </div>
                </div>

                {/* Botones de Acción Rápida */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <button 
                    onClick={() => setModalEscanearQR(true)}
                    className="flex flex-col items-center gap-3.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 rounded-2xl cursor-pointer text-slate-800 dark:text-slate-200 outline-none w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center transition-transform duration-250 hover:scale-105">
                      <QrCode className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3">Escanear QR</span>
                  </button>

                  <button 
                    onClick={() => setModalEnviar(true)}
                    className="flex flex-col items-center gap-3.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 rounded-2xl cursor-pointer text-slate-800 dark:text-slate-200 outline-none w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 flex items-center justify-center transition-transform duration-250 hover:scale-105">
                      <Send className="w-5 h-5 -mr-0.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3">Enviar dinero</span>
                  </button>

                  <button 
                    onClick={() => setModalRecargar(true)}
                    className="flex flex-col items-center gap-3.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 rounded-2xl cursor-pointer text-slate-800 dark:text-slate-200 outline-none w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center transition-transform duration-250 hover:scale-105">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3">Recargar dinero</span>
                  </button>

                  <button 
                    onClick={() => setModalRecibir(true)}
                    className="flex flex-col items-center gap-3.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 rounded-2xl cursor-pointer text-slate-800 dark:text-slate-200 outline-none w-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center transition-transform duration-250 hover:scale-105">
                      <ArrowDownToLine className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-3">Recibir dinero</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  
                  {/* Resumen de Transferencias Recientes */}
                  <div className="lg:col-span-3">
                    <h3 className="font-['Syne'] text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Transferencias Recientes
                    </h3>
                    <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80">
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-l-xl">
                              Destino / Origen
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-r-xl">
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                          {transacciones.slice(0, 5).map((t, i) => {
                            const isRecibido = t.comercio?.includes('Recarga') || t.comercio?.includes('Recibido') || t.tipo === 'recibir' || t.comercio?.toLowerCase().includes('recibo') || t.comercio?.toLowerCase().includes('recibido');
                            return (
                              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150">
                                <td className="px-4 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                                  {t.comercio}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                                    {t.categoria}
                                  </span>
                                </td>
                                <td className={`px-4 py-3.5 text-sm font-bold ${isRecibido ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                  {isRecibido ? '+' : '-'}${t.monto?.toLocaleString()}
                                </td>
                                <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">
                                  {formatDate(t.fecha)}
                                </td>
                              </tr>
                            );
                          })}
                          {transacciones.length === 0 && (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                No tienes movimientos recientes
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Código QR único del Usuario */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                    <h3 className="font-['Syne'] text-base text-slate-800 dark:text-white font-bold mb-4">
                      Mi Código QR
                    </h3>
                    
                    {/* Contenedor blanco puro con padding */}
                    <div className="bg-white p-3 rounded-xl border border-slate-100 dark:border-slate-700 mx-auto inline-block">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(perfil?.llave || '')}`}
                        alt="Código QR del usuario" 
                        className="w-32 h-32"
                      />
                    </div>
                    
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-[200px]">
                      Escanea este código QR único desde otro dispositivo para transferir dinero usando la llave.
                    </p>
                    
                    <div className="mt-4 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 pl-3.5 pr-2 py-1.5 rounded-full shadow-sm text-xs font-bold">
                      <span>Llave:</span>
                      <code className="font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded text-[11px]">
                        {perfil?.llave || "VT-000000"}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(perfil?.llave || "");
                          setCopiado(true);
                          setTimeout(() => setCopiado(false), 2000);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800/80 cursor-pointer transition-colors duration-150 outline-none border-none bg-transparent flex items-center justify-center"
                        title="Copiar Llave"
                      >
                        {copiado ? (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 px-1">¡Copiado!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 💳 SECCIÓN MI MEMBRESÍA (PLANES) */}
            {seccion === 'membresia' && (
              <div>
                <div style={{ marginBottom: "28px" }}>
                  <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Mi Membresía</h1>
                  <p style={{ color: themeStyles.textMuted, marginTop: "4px" }}>Detalles de tu cuenta actual y planes de VittaCard</p>
                </div>

                {/* Resumen del plan activo */}
                {perfil && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', 
                    color: 'white', borderRadius: '16px', padding: '24px', 
                    marginBottom: '32px', boxShadow: '0 8px 24px rgba(6,182,212,0.2)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                          PLAN ACTIVO
                        </span>
                        <h2 style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: 800, margin: '8px 0 4px' }}>
                          VittaCard {perfil.planId?.toUpperCase()}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.9 }}>Asociado a la cuenta: <strong>{perfil.cuenta || "Sin asignar"}</strong></p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', opacity: 0.8 }}>Estado de membresía</span>
                        <h3 style={{ margin: '4px 0 0', fontWeight: 'bold' }}>✓ ACTIVA</h3>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de todos los planes */}
                <h3 style={{ fontFamily: 'Syne', fontSize: '20px', marginBottom: '16px' }}>Planes Disponibles</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                  {planes.map(plan => {
                    const c = planColors[plan.id] || planColors.free;
                    const esPlanActivo = perfil?.planId === plan.id;
                    const isPremium = plan.id === "premium";

                    const cardStyle = isPremium
                      ? {
                          background: "linear-gradient(135deg, #7C3AED 0%, #4338CA 100%)",
                          color: "white",
                          border: "1px solid rgba(124, 58, 237, 0.4)",
                          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 8px 10px -6px rgba(124, 58, 237, 0.5)",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "340px",
                          borderRadius: "16px",
                          padding: "24px"
                        }
                      : {
                          background: "rgba(15, 23, 42, 0.5)",
                          backdropFilter: "blur(12px)",
                          WebkitBackdropFilter: "blur(12px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color: "#F8FAFC",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "340px",
                          borderRadius: "16px",
                          padding: "24px"
                        };

                    return (
                      <div key={plan.id} style={cardStyle}>
                        {isPremium && (
                          <div style={{
                            position: "absolute",
                            top: "-12px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#F59E0B",
                            color: "#0F172A",
                            fontSize: "10px",
                            fontWeight: "800",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            boxShadow: "0 4px 10px rgba(245, 158, 11, 0.4)",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            zIndex: 10
                          }}>
                            ⭐ RECOMENDADO
                          </div>
                        )}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <div>
                              <div style={{
                                display: "inline-block",
                                background: isPremium ? "rgba(255, 255, 255, 0.2)" : c.bg,
                                color: isPremium ? "#FFFFFF" : c.accent,
                                padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, marginBottom: "8px"
                              }}>
                                {plan.subtitulo}
                              </div>
                              <h2 style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800, color: isPremium ? "#FFFFFF" : c.accent, margin: "4px 0" }}>{plan.nombre}</h2>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "Syne", fontSize: "20px", fontWeight: 800, color: isPremium ? "#FFFFFF" : "#F8FAFC" }}>
                                ${plan.cuota?.toLocaleString()}
                              </div>
                              <div style={{ fontSize: "11px", color: isPremium ? "#E2E8F0" : "#94A3B8" }}>/mes</div>
                            </div>
                          </div>

                          {/* Beneficios */}
                          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0, marginBottom: "20px" }}>
                            {(plan.beneficios || []).map((b, i) => (
                              <li key={i} style={{ display: "flex", gap: "8px", fontSize: "12.5px", color: isPremium ? "#F1F5F9" : "#E2E8F0", alignItems: "flex-start" }}>
                                <CheckCircle size={16} color={isPremium ? "#F59E0B" : c.accent} style={{ flexShrink: 0, marginTop: "2px" }} />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Botón interactivo para Adquirir Plan */}
                        <div>
                          <button
                            onClick={() => handleAdquirirPlan(plan)}
                            disabled={esPlanActivo}
                            style={{
                              width: "100%",
                              padding: "10px",
                              border: esPlanActivo 
                                ? "2px solid #10B981" 
                                : (isPremium ? "2px solid #F59E0B" : `2px solid ${c.accent}`),
                              borderRadius: "10px",
                              background: esPlanActivo 
                                ? "#10B981" 
                                : (isPremium ? "#F59E0B" : "transparent"),
                              color: esPlanActivo 
                                ? "white" 
                                : (isPremium ? "#0F172A" : c.accent),
                              cursor: esPlanActivo ? "not-allowed" : "pointer",
                              fontWeight: 700,
                              fontSize: "13px",
                              transition: "all 0.15s"
                            }}
                            onMouseEnter={e => {
                              if (!esPlanActivo) {
                                if (isPremium) {
                                  e.target.style.background = "transparent";
                                  e.target.style.color = "#F59E0B";
                                } else {
                                  e.target.style.background = c.accent;
                                  e.target.style.color = "white";
                                }
                              }
                            }}
                            onMouseLeave={e => {
                              if (!esPlanActivo) {
                                if (isPremium) {
                                  e.target.style.background = "#F59E0B";
                                  e.target.style.color = "#0F172A";
                                } else {
                                  e.target.style.background = "transparent";
                                  e.target.style.color = c.accent;
                                }
                              }
                            }}
                          >
                            {esPlanActivo ? "✓ Plan Activo" : `Adquirir por $${plan.cuota?.toLocaleString()}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🏪 SECCIÓN COMERCIOS */}
            {seccion === 'comercios' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800, margin: 0 }}>Comercios Aliados</h1>
                    <p style={{ color: themeStyles.textMuted, marginTop: "4px", marginBottom: 0 }}>Disfruta de beneficios y descuentos especiales en las siguientes marcas asociadas a VittaCard:</p>
                  </div>
                  {/* Selector de Vista (Lista / Mapa) */}
                  <div style={{ display: "flex", background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#E2E8F0", padding: "4px", borderRadius: "8px", gap: "4px" }}>
                    <button
                      onClick={() => setVistaComercios("lista")}
                      style={{
                        padding: "6px 12px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                        background: vistaComercios === "lista" ? "#06B6D4" : "transparent",
                        color: vistaComercios === "lista" ? "white" : themeStyles.text,
                        transition: "all 0.15s"
                      }}
                    >
                      📋 Lista
                    </button>
                    <button
                      onClick={() => setVistaComercios("mapa")}
                      style={{
                        padding: "6px 12px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                        background: vistaComercios === "mapa" ? "#06B6D4" : "transparent",
                        color: vistaComercios === "mapa" ? "white" : themeStyles.text,
                        transition: "all 0.15s"
                      }}
                    >
                      🗺️ Mapa
                    </button>
                  </div>
                </div>

                {vistaComercios === "mapa" ? (
                  <MapaAliados rol="usuario" userPlan={perfil?.planId} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aliados.map((a, i) => {
                      const catStyle = getCategoriaStyle(a.sector);
                      const descuento = obtenerDescuento(perfil?.planId, a.sector);
                      
                      const getSectorIcon = (sector) => {
                        const s = (sector || "").toLowerCase();
                        switch (s) {
                          case "salud": return <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />;
                          case "deporte": return <Dumbbell className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />;
                          case "supermercado": return <ShoppingCart className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
                          case "restaurante": return <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />;
                          case "farmacia": return <Pill className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
                          default: return <Store className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0" />;
                        }
                      };

                      return (
                        <div key={i} className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-700/30 bg-white/70 dark:bg-slate-800/40 backdrop-blur-md p-6 flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-cyan-950/20">
                          {/* Banner de Descuento (En la esquina inferior derecha) */}
                          <div className="absolute bottom-6 right-6 bg-teal-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg shadow-md tracking-wider uppercase border border-teal-300/30">
                            {descuento} OFF
                          </div>

                          <div>
                            {/* Titular con Iconografía */}
                            <div className="flex items-center gap-2.5 mb-2">
                              {getSectorIcon(a.sector)}
                              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight max-w-[70%] truncate">
                                {a.nombre}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">NIT: {a.nit || "No registrado"}</p>
                            
                            {/* Badge de Categoría */}
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
                              {a.sector || "Otro"}
                            </span>
                          </div>

                          {/* Ubicación y Teléfono */}
                          <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/30 pt-4 pb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{a.ubicacion || "No disponible"}</span>
                            </div>
                            {a.telefono && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{a.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 🛒 SECCIÓN COMPRAS */}
            {seccion === 'compras' && (
              <div>
                <h2>Compras</h2>
                <p style={{ color: themeStyles.textMuted }}>Total de compras registradas: {transacciones.length}</p>
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {transacciones.map((t, i) => (
                    <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{t.comercio}</h4>
                        <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>{formatDate(t.fecha)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>${t.monto?.toLocaleString()}</span>
                        <div style={{ fontSize: '11px', color: '#10B981' }}>✓ Completado</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 💰 SECCIÓN TRANSACCIONES */}
            {seccion === 'transacciones' && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div>
                    <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Historial de Transacciones</h1>
                    <p style={{ color: themeStyles.textMuted, marginTop: "4px" }}>Revisa todos tus movimientos y estadísticas personales</p>
                  </div>
                </div>

                {/* Estadísticas Personales */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                  <div className="card" style={{ borderTop: "4px solid #00B4B4" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>{transacciones.length}</div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Total transacciones</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #7C3AED" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>${userVolumenTotal.toLocaleString()}</div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Volumen total procesado</div>
                  </div>
                  <div className="card" style={{ borderTop: "4px solid #F59E0B" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>
                      ${userPromedioTx.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "12px", color: themeStyles.textMuted, marginTop: "4px" }}>Promedio por transacción</div>
                  </div>
                </div>

                {/* Buscador */}
                <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
                  <input
                    className="input-field"
                    placeholder="🔍  Buscar por comercio, categoría..."
                    value={searchTx}
                    onChange={e => setSearchTx(e.target.value)}
                    style={{ maxWidth: "400px" }}
                  />
                </div>

                {/* Tabla de Historial */}
                <div className="card">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: theme === "dark" ? "#1e293b" : "#F3F4F6", borderBottom: "2px solid " + themeStyles.border }}>
                        {["Destino / Origen", "Categoría", "Monto", "Fecha", "Estado"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", color: themeStyles.textMuted, fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTxs.map((tx, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid " + (theme === "dark" ? "#334155" : "#F9FAFB") }}>
                          <td style={{ padding: "14px", fontWeight: 600, fontSize: "13px" }}>{tx.comercio}</td>
                          <td style={{ padding: "14px" }}>
                            <span style={{ background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#E0F7F7", color: theme === "dark" ? "#fff" : "#008A8A", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                              {tx.categoria}
                            </span>
                          </td>
                          <td style={{ padding: "14px", fontFamily: "Syne", fontWeight: 800, color: tx.comercio?.includes('Recarga') ? '#10B981' : themeStyles.text }}>
                            {tx.comercio?.includes('Recarga') ? '+' : '-'}${tx.monto?.toLocaleString()}
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

            {/* 🎁 SECCIÓN BENEFICIOS */}
            {seccion === 'beneficios' && (
              <div>
                <h2>Beneficios VittaCard</h2>
                <p style={{ color: themeStyles.textMuted }}>Disfruta de las ventajas de tu plan actual:</p>
                <ul style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {planes.find(p => p.id === perfil?.planId)?.beneficios?.map((b, i) => (
                    <li key={i} style={{ padding: '12px 16px', background: theme === "dark" ? "#0f172a" : "#F8FAFC", borderRadius: '10px', borderLeft: '3px solid #06B6D4', listStyleType: 'none' }}>
                      ✨ {b}
                    </li>
                  )) || <li>No hay beneficios específicos de tu plan cargados.</li>}
                </ul>
              </div>
            )}

            {/* ⚙️ SECCIÓN AJUSTES */}
            {seccion === 'ajustes' && (
              <div className="flex flex-col gap-6 w-full">
                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
                  <div>
                    <h1 className="text-3xl font-black font-['Syne'] text-slate-900 dark:text-white leading-tight">
                      Ajustes y Seguridad
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Gestiona tu perfil, seguridad de tarjetas y preferencias.
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/40">
                    ROL: {perfil?.rol?.toUpperCase() || "USER"}
                  </div>
                </div>

                {/* Contenedor Grid Principal */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start w-full">
                  
                  {/* Columna Izquierda: Sub-Menú Lateral */}
                  <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-1.5">
                    {[
                      { id: 'perfil', name: 'Perfil', icon: User },
                      { id: 'documentos', name: 'Documentos', icon: FileText },
                      { id: 'seguridad', name: 'Seguridad', icon: Shield },
                      { id: 'preferencias', name: 'Preferencias', icon: Sliders }
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isActive = subTab === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSubTab(opt.id)}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold transition-all duration-200 text-left cursor-pointer ${
                            isActive
                              ? "bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/10"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-950 dark:hover:text-white rounded-xl bg-transparent border-none"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Columna Derecha: Contenido de Sub-Tabs */}
                  <div className="md:col-span-3 flex flex-col gap-6 w-full">
                    
                    {/* VISTA 1: PERFIL */}
                    {subTab === 'perfil' && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-8">
                        
                        {/* Título de Sección */}
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Syne']">
                            Datos de tu Perfil
                          </h2>
                        </div>

                        {/* Sección Avatar */}
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* Contenedor del Avatar */}
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-blue-50/15 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-black shadow-inner">
                              {(perfil?.nombre || currentUser?.email || "U")[0].toUpperCase()}
                            </div>
                            {/* Botón Upload superpuesto */}
                            <button
                              type="button"
                              onClick={() => alert("Simulando carga de avatar...")}
                              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md transition-colors duration-200 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Info a la derecha del Avatar */}
                          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                              {perfil?.nombre || "Cargando usuario..."}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">VittaCard ID:</span>
                              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-300">
                                {perfilId || currentUser?.uid?.slice(0, 10) || "N/A"}
                              </code>
                            </div>
                          </div>
                        </div>

                        {/* Tarjeta de Datos (Info Box) */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-100/40 dark:border-slate-800/20">
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                              Nombre Completo
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {perfil?.nombre || "No especificado"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                              Documento de Identidad
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {perfil?.documento || "1.061.284.XXX"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                              Correo Electrónico
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {currentUser?.email || perfil?.email || "No especificado"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                              Teléfono Celular
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {perfil?.telefono || "No registrado"}
                            </span>
                          </div>
                        </div>

                        {/* Botón de Acción */}
                        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800/80 pt-6">
                          <button
                            type="button"
                            onClick={() => alert("Solicitud de modificación enviada. El equipo de soporte se contactará contigo.")}
                            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all duration-200 cursor-pointer border-none"
                          >
                            Solicitar Modificación de Datos
                          </button>
                        </div>

                      </div>
                    )}

                    {/* VISTA 2: DOCUMENTOS */}
                    {subTab === 'documentos' && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Syne']">
                            Documentación Vinculada
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Visualiza y gestiona los documentos oficiales cargados para la verificación de tu cuenta de acuerdo con las normativas financieras.
                        </p>
                        
                        <div className="border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-slate-50/50 dark:bg-slate-950/20">
                          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Copia de Documento de Identidad (Frente & Dorso)</p>
                            <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">✓ Verificado y Aprobado</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VISTA 3: SEGURIDAD (CON FORMULARIO REAL) */}
                    {subTab === 'seguridad' && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Syne']">
                            Ajustes de Seguridad
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Actualiza tu número telefónico celular de contacto o realiza un cambio en tu contraseña de ingreso.
                        </p>

                        <form onSubmit={handleGuardarAjustes} className="flex flex-col gap-5 max-w-lg mt-2">
                          {msgAjustes && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              {msgAjustes}
                            </div>
                          )}
                          {errorAjustes && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold">
                              {errorAjustes}
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Teléfono Celular
                            </label>
                            <input 
                              type="text"
                              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" 
                              value={editTelefono} 
                              onChange={e => setEditTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Nueva Contraseña (dejar vacío si no deseas cambiarla)
                            </label>
                            <div className="relative w-full">
                              <input 
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" 
                                type={verContrasena ? "text" : "password"}
                                value={nuevaContrasena} 
                                onChange={e => setNuevaContrasena(e.target.value)} 
                                placeholder="Mínimo 6 caracteres"
                              />
                              <button
                                type="button"
                                onClick={() => setVerContrasena(!verContrasena)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer bg-transparent border-none p-0 outline-none"
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

                          <button
                            type="submit"
                            disabled={guardandoAjustes}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-600/10 cursor-pointer transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-start border-none"
                          >
                            {guardandoAjustes ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="31.4" />
                                  <path d="M12 2a10 10 0 0 1 10 10" />
                                </svg>
                                <span>Guardando...</span>
                              </>
                            ) : (
                              "Guardar Ajustes"
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* VISTA 4: PREFERENCIAS */}
                    {subTab === 'preferencias' && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-['Syne']">
                            Preferencias de Cuenta
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Ajusta la configuración de notificaciones, canales de comunicación y visualización preferida.
                        </p>
                        
                        <div className="flex flex-col gap-4">
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Recibir alertas de compras y transacciones por email</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notificar promociones y ofertas exclusivas de aliados</span>
                          </label>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── MODAL: ENVIAR DINERO (CON BUSCADOR DINÁMICO) ── */}
      {modalEnviar && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "480px", background: themeStyles.cardBg, color: themeStyles.text }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "20px" }}>Enviar Dinero</h3>
            <form onSubmit={handleEnviarSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Buscador de Destinatario */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>
                  Destinatario (Buscar por Correo o Llave única VT-XXXXXX)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="input-field"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setDestEncontrado(null);
                      setSearchError("");
                    }}
                    placeholder="Ej: VT-A1B2C3 o correo@ejemplo.com"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleBuscarDestinatario}
                    disabled={buscando}
                    style={{
                      background: "#06B6D4", color: "white", border: "none", borderRadius: "6px",
                      padding: "10px 16px", cursor: "pointer", fontWeight: 600
                    }}
                  >
                    {buscando ? "..." : "Buscar"}
                  </button>
                </div>
                {searchError && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>{searchError}</p>}
                
                {destEncontrado && (
                  <div style={{
                    marginTop: "10px", padding: "10px", borderRadius: "8px",
                    background: theme === "dark" ? "rgba(255,255,255,0.05)" : "#E0F7F7",
                    border: "1px solid " + (theme === "dark" ? "#334155" : "#00B4B4"),
                    color: theme === "dark" ? "#fff" : "#008A8A"
                  }}>
                    <p style={{ margin: 0, fontSize: "13px" }}>
                      <strong>Destinatario encontrado:</strong> {destEncontrado.nombres || destEncontrado.nombre}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.8 }}>
                      Tipo: {destEncontrado.tipo === "usuario" ? "Usuario VittaCard" : "Comercio Aliado"}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Monto ($)</label>
                <input 
                  className="input-field" 
                  type="number" 
                  value={formEnviar.monto} 
                  onChange={e => setFormEnviar({ ...formEnviar, monto: e.target.value })} 
                  required 
                  min="1" 
                  max={perfil?.saldo || 0}
                  placeholder={`Máximo disponible: $${(perfil?.saldo || 0).toLocaleString()}`}
                />
              </div>
              
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Categoría</label>
                <select 
                  className="input-field" 
                  value={formEnviar.categoria} 
                  onChange={e => setFormEnviar({ ...formEnviar, categoria: e.target.value })}
                >
                  <option value="Salud">Salud</option>
                  <option value="Deporte">Deporte</option>
                  <option value="Alimentos">Alimentos</option>
                  <option value="Farmacia">Farmacia</option>
                  <option value="Entretenimiento">Entretenimiento</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button 
                  type="submit" 
                  disabled={!destEncontrado || enviandoDinero}
                  className="btn-primary" 
                  style={{ 
                    background: '#06B6D4',
                    opacity: (destEncontrado && !enviandoDinero) ? 1 : 0.6,
                    cursor: (destEncontrado && !enviandoDinero) ? "pointer" : "not-allowed"
                  }}
                >
                  {enviandoDinero ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="31.4" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    "Enviar dinero"
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setModalEnviar(false);
                    setSearchQuery("");
                    setDestEncontrado(null);
                    setSearchError("");
                  }} 
                  style={{
                    flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                    background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECARGAR DINERO ── */}
      {modalRecargar && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "480px", background: themeStyles.cardBg, color: themeStyles.text }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "20px" }}>Recargar Dinero</h3>
            <form onSubmit={handleRecargarSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Tarjeta de Origen (Simulación PSE / Débito)</label>
                <input 
                  className="input-field" 
                  value={formRecargar.tarjeta} 
                  onChange={e => setFormRecargar({ ...formRecargar, tarjeta: e.target.value })} 
                  required 
                  placeholder="5200-XXXX-XXXX-XXXX"
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Monto a Recargar ($)</label>
                <input 
                  className="input-field" 
                  type="number" 
                  value={formRecargar.monto} 
                  onChange={e => setFormRecargar({ ...formRecargar, monto: e.target.value })} 
                  required 
                  min="1000" 
                  placeholder="Ej: 50000"
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button 
                  type="submit" 
                  disabled={procesandoPSE}
                  className="btn-primary" 
                  style={{ 
                    background: '#10B981',
                    opacity: procesandoPSE ? 0.7 : 1,
                    cursor: procesandoPSE ? "not-allowed" : "pointer"
                  }}
                >
                  {procesandoPSE ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="31.4" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    "Recargar"
                  )}
                </button>
                <button type="button" onClick={() => setModalRecargar(false)} style={{
                  flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                  background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RECIBIR DINERO (QR CON LLAVE) ── */}
      {modalRecibir && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "400px", textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', background: themeStyles.cardBg, color: themeStyles.text }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "16px" }}>Recibir Dinero</h3>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(perfil?.llave || '')}`}
              alt="Código QR del usuario" 
              style={{ border: '4px solid #fff', borderRadius: '8px', width: '180px', height: '180px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)' }}
            />
            <h4 style={{ margin: '14px 0 4px', fontSize: '15px' }}>{perfil?.nombres}</h4>
            <p style={{ fontSize: '12px', color: themeStyles.textMuted, margin: '0 0 20px', lineHeight: 1.4 }}>
              Muestra este código para recibir transferencias de otros usuarios de VittaCard.<br />
              <strong>Llave única: {perfil?.llave}</strong>
            </p>
            <button 
              type="button" 
              onClick={() => setModalRecibir(false)} 
              className="btn-primary"
              style={{ background: '#6366F1' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: ESCANEAR COBRO QR (GLASSMORPHIC) ── */}
      {modalEscanearQR && (
        <div style={{
          position: "fixed", inset: 0, 
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
          padding: "20px"
        }}>
          <div className="card" style={{ 
            width: "100%", maxWidth: "450px", 
            background: theme === "dark" ? "rgba(30, 41, 59, 0.75)" : "rgba(255, 255, 255, 0.85)", 
            color: themeStyles.text,
            border: "1px solid " + (theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"),
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            borderRadius: "24px",
            padding: "30px",
            position: "relative"
          }}>
            <button 
              onClick={() => {
                setModalEscanearQR(false);
                setConfirmingPayment(false);
                setIntentIdQR("");
                setIntentData(null);
                setScanError("");
              }}
              style={{
                position: "absolute", right: "20px", top: "20px",
                background: "transparent", border: "none", color: themeStyles.textMuted,
                fontSize: "20px", cursor: "pointer", fontWeight: "bold"
              }}
            >
              ✕
            </button>

            {!confirmingPayment ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800, margin: 0 }}>Escanear Código QR</h3>
                  <p style={{ color: themeStyles.textMuted, fontSize: "13px", marginTop: "6px" }}>
                    Apunta tu cámara al código QR de cobro generado por el comercio.
                  </p>
                </div>

                {/* Contenedor de cámara */}
                <div style={{ 
                  width: "100%", height: "260px", background: "#000", 
                  borderRadius: "16px", overflow: "hidden", display: "flex", 
                  alignItems: "center", justifyContent: "center", position: "relative",
                  border: "2px solid " + (theme === "dark" ? "#334155" : "#E2E8F0")
                }}>
                  <div id="reader" style={{ width: "100%", height: "100%" }}></div>
                  {procesandoPagoQR && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent"></div>
                    </div>
                  )}
                </div>

                {scanError && (
                  <div style={{ 
                    color: "#EF4444", fontSize: "12.5px", textAlign: "center", 
                    background: "rgba(239, 68, 68, 0.1)", padding: "10px", 
                    borderRadius: "8px", width: "100%", border: "1px solid rgba(239, 68, 68, 0.2)"
                  }}>
                    {scanError}
                  </div>
                )}

                {/* MODO DEV - Simulación manual */}
                <div style={{ 
                  width: "100%", borderTop: "1px solid " + themeStyles.border, 
                  paddingTop: "16px", marginTop: "8px" 
                }}>
                  <div style={{ 
                    display: "flex", alignItems: "center", justifyBetween: "space-between", 
                    marginBottom: "8px", justifyContent: "space-between"
                  }}>
                    <span style={{ 
                      fontSize: "11px", fontWeight: 800, color: "#A855F7", 
                      background: "rgba(168, 85, 247, 0.15)", padding: "2px 8px", 
                      borderRadius: "12px", letterSpacing: "0.5px" 
                    }}>
                      MODO DEV 🛠️
                    </span>
                    <span style={{ fontSize: "11px", color: themeStyles.textMuted }}>Ingresar ID manualmente</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <input
                      className="input-field"
                      placeholder="Pegar ID del Intento de Pago..."
                      value={intentIdQR}
                      onChange={e => setIntentIdQR(e.target.value)}
                      style={{ fontSize: "13px", padding: "10px", flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => handlePaymentScanned(intentIdQR)}
                      style={{
                        background: "#A855F7", color: "white", border: "none", 
                        borderRadius: "10px", padding: "10px 16px", cursor: "pointer", 
                        fontWeight: 600, fontSize: "13px",
                        boxShadow: "0 4px 10px rgba(168, 85, 247, 0.2)"
                      }}
                    >
                      Validar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Vista de Confirmación del Pago
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    background: "rgba(168, 85, 247, 0.15)", color: "#A855F7",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700
                  }}>
                    CONFIRMAR TRANSACCIÓN
                  </span>
                  <h3 style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, margin: "12px 0 0" }}>
                    Detalle del Pago
                  </h3>
                </div>

                <div style={{
                  background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderRadius: "16px", padding: "20px", border: "1px solid " + themeStyles.border,
                  display: "flex", flexDirection: "column", gap: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: themeStyles.textMuted, fontSize: "13px" }}>Comercio:</span>
                    <strong style={{ fontSize: "14px" }}>{intentData.comercioNombre}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: themeStyles.textMuted, fontSize: "13px" }}>Sector:</span>
                    <span style={{ 
                      fontSize: "12px", fontWeight: 600, color: "#06B6D4",
                      background: "rgba(6, 182, 212, 0.1)", padding: "2px 8px", borderRadius: "12px"
                    }}>
                      {intentData.comercioSector || "Otro"}
                    </span>
                  </div>
                  <hr style={{ border: 0, borderTop: "1px dashed " + themeStyles.border, margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: themeStyles.textMuted, fontSize: "13px" }}>Monto original:</span>
                    <span style={{ fontSize: "14px", textDecoration: "line-through", opacity: 0.7 }}>
                      ${intentData.monto?.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: themeStyles.textMuted, fontSize: "13px" }}>Descuento ({calcularMontoFinal(intentData.monto, perfil.planId, intentData.comercioSector).descText} por tu plan):</span>
                    <span style={{ fontSize: "13px", color: "#10B981", fontWeight: "bold" }}>
                      -${calcularMontoFinal(intentData.monto, perfil.planId, intentData.comercioSector).descuento?.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "6px" }}>
                    <span style={{ color: themeStyles.text, fontWeight: "bold", fontSize: "14px" }}>Total a pagar:</span>
                    <strong style={{ fontSize: "24px", color: "#06B6D4", fontFamily: "Syne" }}>
                      ${calcularMontoFinal(intentData.monto, perfil.planId, intentData.comercioSector).montoFinal?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button
                    onClick={handleConfirmarPagoQR}
                    disabled={procesandoPagoQR}
                    style={{
                      flex: 2, background: "#06B6D4", color: "white", border: "none",
                      borderRadius: "12px", padding: "14px", cursor: "pointer",
                      fontWeight: 700, fontSize: "14px", display: "flex", 
                      alignItems: "center", justifyContent: "center", gap: "8px",
                      boxShadow: "0 4px 15px rgba(6, 182, 212, 0.25)"
                    }}
                  >
                    {procesandoPagoQR ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent"></div>
                    ) : (
                      "Confirmar Pago 💳"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmingPayment(false);
                      setIntentIdQR("");
                      setIntentData(null);
                    }}
                    disabled={procesandoPagoQR}
                    style={{
                      flex: 1, background: "transparent", 
                      border: "2px solid " + (theme === "dark" ? "#334155" : "#E2E8F0"),
                      borderRadius: "12px", padding: "14px", cursor: "pointer",
                      color: themeStyles.text, fontWeight: 600, fontSize: "14px"
                    }}
                  >
                    Atrás
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
