import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";

const COLORS = ["#00B4B4", "#7C3AED", "#1A2B3C", "#F59E0B", "#EF4444", "#10B981"];

export default function VittaData() {
  const [txs, setTxs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [tSnap, uSnap] = await Promise.all([
        getDocs(collection(db, "transacciones")),
        getDocs(collection(db, "usuarios")),
      ]);
      setTxs(tSnap.docs.map(d => d.data()));
      setUsuarios(uSnap.docs.map(d => d.data()));
      setLoading(false);
    };
    load();
  }, []);

  // Calcular métricas
  const totalVolumen = txs.reduce((s, t) => s + (t.monto || 0), 0);

  const catMap = {};
  txs.forEach(t => { catMap[t.categoria] = (catMap[t.categoria] || 0) + (t.monto || 0); });
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const planMap = {};
  usuarios.forEach(u => { planMap[u.planId] = (planMap[u.planId] || 0) + 1; });
  const planData = [
    { name: "Essential", value: planMap.essential || 0 },
    { name: "LifeStyle", value: planMap.lifestyle || 0 },
    { name: "Platinum", value: planMap.platinum || 0 },
  ];

  const catTopName = catData[0]?.name || "—";
  const avgTx = txs.length ? Math.round(totalVolumen / txs.length) : 0;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "#6B7280" }}>Analizando datos...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>VittaData</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Panel de análisis de tendencias anónimas de consumo</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Volumen total", value: `$${totalVolumen.toLocaleString()}`, icon: "💰", color: "#00B4B4" },
          { label: "Categoría líder", value: catTopName, icon: "🏆", color: "#7C3AED" },
          { label: "Ticket promedio", value: `$${avgTx.toLocaleString()}`, icon: "📊", color: "#F59E0B" },
          { label: "Usuarios totales", value: usuarios.length, icon: "👥", color: "#1A2B3C" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ borderTop: `4px solid ${k.color}` }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{k.icon}</div>
            <div style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="card">
          <h3 style={{ fontFamily: "Syne", fontSize: "16px", marginBottom: "20px" }}>💳 Volumen por Categoría</h3>
          {catData.length === 0 ? <p style={{ color: "#9CA3AF" }}>Sin datos</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, "Monto"]} />
                <Bar dataKey="value" fill="#00B4B4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "Syne", fontSize: "16px", marginBottom: "20px" }}>📋 Usuarios por Plan</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={planData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {planData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Oportunidades */}
      <div className="card">
        <h3 style={{ fontFamily: "Syne", fontSize: "16px", marginBottom: "20px" }}>🎯 Análisis de Oportunidades de Negocio</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {catData.slice(0, 3).map((c, i) => (
            <div key={i} style={{
              background: "#F8FAFC", borderRadius: "12px", padding: "16px",
              borderLeft: `4px solid ${COLORS[i]}`
            }}>
              <div style={{ fontFamily: "Syne", fontSize: "18px", fontWeight: 800, color: COLORS[i] }}>
                {Math.round((c.value / totalVolumen) * 100)}%
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px", margin: "4px 0" }}>{c.name}</div>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>
                ${c.value.toLocaleString()} en volumen
              </div>
              <div style={{
                marginTop: "10px", background: COLORS[i] + "20", borderRadius: "6px",
                padding: "6px 10px", fontSize: "11px", color: COLORS[i], fontWeight: 600
              }}>
                {i === 0 ? "🔥 Mayor oportunidad" : i === 1 ? "⚡ Alta demanda" : "📈 En crecimiento"}
              </div>
            </div>
          ))}
          {catData.length === 0 && (
            <p style={{ color: "#9CA3AF", gridColumn: "1/-1" }}>Registra transacciones para ver oportunidades</p>
          )}
        </div>
      </div>
    </div>
  );
}
