// ============================================
// SCRIPT DE INICIALIZACIÓN DE DATOS
// Ejecuta seedDatabase() una sola vez desde la consola del navegador
// o desde un componente temporal para poblar Firestore
// ============================================

import { db } from "./config";
import { collection, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    console.log("Iniciando carga de datos...");

    // Eliminar planes antiguos para evitar colisiones
    const antiguosPlanes = ["essential", "lifestyle", "platinum"];
    for (const idPlan of antiguosPlanes) {
      try {
        await deleteDoc(doc(db, "planes", idPlan));
        console.log(`Plan antiguo eliminado: ${idPlan}`);
      } catch (err) {
        console.warn(`Error eliminando plan antiguo ${idPlan}:`, err);
      }
    }

    // PLANES
    const planes = [
      {
        id: "free",
        nombre: "Free",
        subtitulo: "Básico",
        cuota: 0,
        descuento: 0.0,
        tarjeta: "Digital",
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
        descuento: 0.05,
        tarjeta: "Física Estándar",
        beneficios: [
          "Descuento del 5% en todos los comercios",
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
        descuento: 0.10,
        tarjeta: "Personalizada",
        beneficios: [
          "Descuento del 10% en todos los comercios",
          "Tarjeta Física Personalizada",
          "Prioridad en atención y soporte 24/7",
          "Acceso a preventas y ofertas especiales",
        ],
        color: "#14B8A6",
      },
      {
        id: "premium",
        nombre: "Premium",
        subtitulo: "Recomendado",
        cuota: 24900,
        descuento: 0.15,
        tarjeta: "Metálica Black",
        cashback: 0.01,
        beneficios: [
          "Descuento del 15% en todos los comercios",
          "Tarjeta Metálica Black exclusiva",
          "1% de Cashback acumulable en compras",
          "Acceso a salas VIP y eventos exclusivos",
        ],
        color: "#7C3AED",
      },
    ];

    for (const plan of planes) {
      await setDoc(doc(db, "planes", plan.id), plan);
    }
    console.log("✅ Planes creados");

    // ALIADOS COMERCIALES
    const aliados = [
      { nombre: "Farmacia Medical", nit: "900123456-1", ubicacion: "Cra 7 # 67-9", sector: "Salud", activo: true },
      { nombre: "Gym Smartfit", nit: "900234567-2", ubicacion: "Cra 8b # 6-90", sector: "Deporte", activo: true },
      { nombre: "Clínica Salud Vida", nit: "900345678-3", ubicacion: "Cra 34 # 3-78", sector: "Salud", activo: true },
      { nombre: "Merca Fruver La 13", nit: "900456789-4", ubicacion: "Cra 6a # 12-7", sector: "Supermercado", activo: true },
      { nombre: "Estadero El Fogón", nit: "900567890-5", ubicacion: "Cra 9 # 7-05", sector: "Restaurante", activo: false },
    ];

    for (const aliado of aliados) {
      await addDoc(collection(db, "aliados"), { ...aliado, creadoEn: new Date() });
    }
    console.log("✅ Aliados creados");

    // USUARIOS DE PRUEBA
    const usuarios = [
      { nombres: "Sarah Gómez", correo: "sarah@gmail.com", cuenta: "5200-4567-8901-2345", planId: "premium", activo: true, creadoEn: new Date("2024-01-15") },
      { nombres: "Carlos Pérez", correo: "carlos@gmail.com", cuenta: "5200-1111-2222-3333", planId: "plus", activo: true, creadoEn: new Date("2024-02-20") },
      { nombres: "María Torres", correo: "maria@gmail.com", cuenta: "5200-4444-5555-6666", planId: "basico", activo: true, creadoEn: new Date("2024-03-10") },
    ];

    for (const usuario of usuarios) {
      await addDoc(collection(db, "usuarios"), usuario);
    }
    console.log("✅ Usuarios de prueba creados");

    // TRANSACCIONES DE EJEMPLO
    const transacciones = [
      { usuarioNombre: "Sarah Gómez", comercio: "Farmacia Medical", monto: 100000, categoria: "Salud", fecha: new Date("2024-04-01T14:00:00"), estado: "completada" },
      { usuarioNombre: "Sarah Gómez", comercio: "Gym Smartfit", monto: 35000, categoria: "Deporte", fecha: new Date("2024-04-02T07:00:00"), estado: "completada" },
      { usuarioNombre: "Carlos Pérez", comercio: "Merca Fruver La 13", monto: 10000, categoria: "Alimentos", fecha: new Date("2024-04-03T07:00:00"), estado: "completada" },
      { usuarioNombre: "María Torres", comercio: "Clínica Salud Vida", monto: 45000, categoria: "Salud", fecha: new Date("2024-04-04T12:00:00"), estado: "completada" },
      { usuarioNombre: "Carlos Pérez", comercio: "Farmacia Medical", monto: 20000, categoria: "Salud", fecha: new Date("2024-04-05T16:00:00"), estado: "completada" },
    ];

    for (const tx of transacciones) {
      await addDoc(collection(db, "transacciones"), tx);
    }
    console.log("✅ Transacciones creadas");

    console.log("🎉 Base de datos inicializada correctamente");
    alert("✅ Base de datos inicializada. Recarga la página.");
  } catch (error) {
    console.error("Error al inicializar:", error);
    alert("❌ Error: " + error.message);
  }
};
