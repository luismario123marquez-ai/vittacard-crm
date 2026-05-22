// ============================================
// SCRIPT DE INICIALIZACIÓN DE DATOS
// Ejecuta seedDatabase() una sola vez desde la consola del navegador
// o desde un componente temporal para poblar Firestore
// ============================================

import { db } from "./config";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

export const seedDatabase = async () => {
  try {
    console.log("Iniciando carga de datos...");

    // PLANES
    const planes = [
      {
        id: "essential",
        nombre: "Essential",
        subtitulo: "Básico",
        cuota: 9999,
        beneficios: [
          "5% de descuento en medicina y exámenes particulares",
          "Cashback del 5% en ofertas seleccionadas",
          "Registro de gastos",
          "5% de descuento en productos de tiendas aliadas",
        ],
        color: "#00B4B4",
      },
      {
        id: "lifestyle",
        nombre: "LifeStyle",
        subtitulo: "Pro",
        cuota: 25999,
        beneficios: [
          "10% de descuento en medicina y exámenes particulares",
          "CashBack del 10% en ofertas seleccionadas",
          "Descuentos del 10% en mensualidades de marcas aliadas",
          "10% de descuento en productos de tiendas aliadas",
        ],
        color: "#7C3AED",
      },
      {
        id: "platinum",
        nombre: "Platinum",
        subtitulo: "Premium",
        cuota: 35999,
        beneficios: [
          "20% de descuento en medicina y exámenes particulares",
          "CashBack del 20% en ofertas seleccionadas",
          "Descuentos del 20% en mensualidades de marcas aliadas",
          "15% de descuento en productos de tiendas aliadas",
        ],
        color: "#1A2B3C",
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
      { nombres: "Sarah Gómez", correo: "sarah@gmail.com", cuenta: "5200-4567-8901-2345", planId: "platinum", activo: true, creadoEn: new Date("2024-01-15") },
      { nombres: "Carlos Pérez", correo: "carlos@gmail.com", cuenta: "5200-1111-2222-3333", planId: "lifestyle", activo: true, creadoEn: new Date("2024-02-20") },
      { nombres: "María Torres", correo: "maria@gmail.com", cuenta: "5200-4444-5555-6666", planId: "essential", activo: true, creadoEn: new Date("2024-03-10") },
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
