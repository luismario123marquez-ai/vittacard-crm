import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { seedDatabase } from "../firebase/seed";

const COLORS = ["#00B4B4", "#7C3AED", "#1A2B3C", "#F59E0B", "#EF4444"];

export default function Dashboard() {
  const [stats, setStats] = useState({ usuarios: 0, aliados: 0, transacciones: 0, ingresos: 0 });
  const [txPorCategoria, setTxPorCategoria] = useState([]);
  const [txRecientes, setTxRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [usSnap, alSnap, txSnap] = await Promise.all([
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "aliados")),
        getDocs(collection(db, "transacciones")),
      ]);

      const txData = txSnap.docs.map(d => d.data());
      const ingresos = txData.reduce((s, t) => s + (t.monto || 0), 0);

      // Agrupar por categoría
      const catMap = {};
      txData.forEach(t => {
        catMap[t.categoria] = (catMap[t.categoria] || 0) + 1;
      });
      const catArr = Object.entries(catMap).map(([name, value]) => ({ name, value }));

      setStats({
        usuarios: usSnap.size,
        aliados: alSnap.size,
        transacciones: txSnap.size,
        ingresos,
      });
      setTxPorCategoria(catArr);
      setTxRecientes(txData.slice(-5).reverse());
      setLoading(false);
    };
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    await seedDatabase();
    setSeeding(false);
    window.location.reload();
  };

  const statCards = [
    { label: "Usuarios Activos", value: stats.usuarios, icon: "👥", color: "#00B4B4" },
    { label: "Aliados Comerciales", value: stats.aliados, icon: "🤝", color: "#7C3AED" },
    { label: "Transacciones", value: stats.transacciones, icon: "💳", color: "#1A2B3C" },
    { label: "Volumen Total", value: `$${stats.ingresos.toLocaleString()}`, icon: "💰", color: "#F59E0B" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
        <p style={{ color: "#6B7280" }}>Cargando datos...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800, color: "#1A2B3C" }}>
            Dashboard
          </h1>
          <p style={{ color: "#6B7280", marginTop: "4px" }}>
            Resumen general del sistema VittaCard
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            background: "#00B4B4", color: "white", border: "none",
            borderRadius: "10px", padding: "10px 20px",
            cursor: "pointer", fontWeight: 600, fontSize: "13px"
          }}
        >
          {seeding ? "Cargando datos..." : "🌱 Sincronizar Base de Datos (Seeding)"}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {statCards.map((s, i) => (
          <div key={i} className="card" style={{ borderTop: `4px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "24px" }}>{s.icon}</span>
              <span style={{
                background: s.color + "20", color: s.color,
                borderRadius: "8px", padding: "4px 10px", fontSize: "11px", fontWeight: 700
              }}>TOTAL</span>
            </div>
            <div style={{ fontSize: "28px", fontFamily: "Syne", fontWeight: 800, color: "#1A2B3C" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
        <div className="card">
          <h3 style={{ fontFamily: "Syne", marginBottom: "20px", fontSize: "16px" }}>Transacciones por Categoría</h3>
          {txPorCategoria.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: "13px" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={txPorCategoria}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#00B4B4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "Syne", marginBottom: "20px", fontSize: "16px" }}>Distribución de Categorías</h3>
          {txPorCategoria.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: "13px" }}>Sin datos aún</p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={txPorCategoria} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                    {txPorCategoria.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {txPorCategoria.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "#374151" }}>{c.name}</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF", marginLeft: "auto" }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="card">
        <h3 style={{ fontFamily: "Syne", marginBottom: "20px", fontSize: "16px" }}>Transacciones Recientes</h3>
        {txRecientes.length === 0 ? (
          <p style={{ color: "#9CA3AF", fontSize: "13px" }}>Sin transacciones registradas</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
                {["Usuario", "Comercio", "Categoría", "Monto", "Estado"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", color: "#9CA3AF", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txRecientes.map((tx, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: 600 }}>{tx.usuarioNombre}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "#6B7280" }}>{tx.comercio}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: "#E0F7F7", color: "#008A8A",
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600
                    }}>{tx.categoria}</span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: "#1A2B3C" }}>
                    ${tx.monto?.toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: "#D1FAE5", color: "#059669",
                      padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600
                    }}>✓ {tx.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
