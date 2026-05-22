import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function Planes() {
  const [planes, setPlanes] = useState([]);
  const [editPlan, setEditPlan] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const load = async () => {
    const [pSnap, uSnap] = await Promise.all([
      getDocs(collection(db, "planes")),
      getDocs(collection(db, "usuarios")),
    ]);
    setPlanes(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setUsuarios(uSnap.docs.map(d => d.data()));
  };

  useEffect(() => { load(); }, []);

  const usersInPlan = (planId) => usuarios.filter(u => u.planId === planId).length;

  const handleSave = async () => {
    await updateDoc(doc(db, "planes", editPlan.id), {
      cuota: editPlan.cuota,
      beneficios: editPlan.beneficios,
    });
    setEditPlan(null);
    load();
  };

  const colors = {
    free: { bg: "#F1F5F9", accent: "#64748B", dark: "#475569" },
    basico: { bg: "#EFF6FF", accent: "#3B82F6", dark: "#1D4ED8" },
    plus: { bg: "#F0FDFA", accent: "#14B8A6", dark: "#0F766E" },
    premium: { bg: "#F3E8FF", accent: "#7C3AED", dark: "#6B21A8" },
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Planes</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Administra los planes Free, Básico, Plus y Premium</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {planes.map(plan => {
          const c = colors[plan.id] || colors.free;
          const count = usersInPlan(plan.id);
          return (
            <div key={plan.id} className="card" style={{ borderTop: `4px solid ${c.accent}`, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{
                    display: "inline-block", background: c.bg, color: c.accent,
                    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, marginBottom: "8px"
                  }}>
                    {plan.subtitulo}
                  </div>
                  <h2 style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, color: c.accent }}>{plan.nombre}</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Syne", fontSize: "22px", fontWeight: 800, color: "#1A2B3C" }}>
                    ${plan.cuota?.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF" }}>/mes</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{
                background: c.bg, borderRadius: "10px", padding: "12px 16px",
                display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px"
              }}>
                <span style={{ fontSize: "20px" }}>👥</span>
                <div>
                  <div style={{ fontFamily: "Syne", fontSize: "20px", fontWeight: 800, color: c.accent }}>{count}</div>
                  <div style={{ fontSize: "11px", color: "#6B7280" }}>usuarios activos</div>
                </div>
              </div>

              {/* Benefits */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {(plan.beneficios || []).map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#374151" }}>
                    <span style={{ color: c.accent, flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setEditPlan({ ...plan })}
                style={{
                  width: "100%", padding: "10px", border: `2px solid ${c.accent}`,
                  borderRadius: "10px", background: "transparent", color: c.accent,
                  cursor: "pointer", fontWeight: 600, fontSize: "13px", transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.target.style.background = c.accent; e.target.style.color = "white"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = c.accent; }}
              >
                ✏️ Editar plan
              </button>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editPlan && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "20px", marginBottom: "20px" }}>
              Editar Plan — {editPlan.nombre}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Cuota mensual ($)</label>
                <input
                  className="input-field"
                  type="number"
                  value={editPlan.cuota}
                  onChange={e => setEditPlan({ ...editPlan, cuota: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>Beneficios (uno por línea)</label>
                <textarea
                  className="input-field"
                  rows={6}
                  value={(editPlan.beneficios || []).join("\n")}
                  onChange={e => setEditPlan({ ...editPlan, beneficios: e.target.value.split("\n").filter(Boolean) })}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button onClick={handleSave} className="btn-primary">Guardar cambios</button>
                <button onClick={() => setEditPlan(null)} style={{
                  flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                  background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {planes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ color: "#9CA3AF" }}>No hay planes. Inicializa los datos desde el Dashboard.</p>
        </div>
      )}
    </div>
  );
}
