import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nombres: "", correo: "", cuenta: "", planId: "essential", activo: true });

  const load = async () => {
    const [uSnap, pSnap] = await Promise.all([
      getDocs(collection(db, "usuarios")),
      getDocs(collection(db, "planes")),
    ]);
    setUsuarios(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setPlanes(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await updateDoc(doc(db, "usuarios", editId), form);
    } else {
      await addDoc(collection(db, "usuarios"), { ...form, creadoEn: new Date() });
    }
    setForm({ nombres: "", correo: "", cuenta: "", planId: "essential", activo: true });
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (u) => {
    setForm({ nombres: u.nombres, correo: u.correo, cuenta: u.cuenta || "", planId: u.planId || "essential", activo: u.activo });
    setEditId(u.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este usuario?")) {
      await deleteDoc(doc(db, "usuarios", id));
      load();
    }
  };

  const planLabel = (id) => planes.find(p => p.id === id)?.nombre || id;
  const planColor = { essential: "#00B4B4", lifestyle: "#7C3AED", platinum: "#1A2B3C" };

  const filtered = usuarios.filter(u =>
    u.nombres?.toLowerCase().includes(search.toLowerCase()) ||
    u.correo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Usuarios</h1>
          <p style={{ color: "#6B7280", marginTop: "4px" }}>Gestión de usuarios registrados en VittaCard</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ nombres: "", correo: "", cuenta: "", planId: "essential", activo: true }); }}
          style={{ background: "#00B4B4", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <input
          className="input-field"
          placeholder="🔍  Buscar por nombre o correo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "480px", position: "relative" }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "20px" }}>
              {editId ? "Editar Usuario" : "Nuevo Usuario"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Nombres y Apellidos</label>
                <input className="input-field" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Correo Electrónico</label>
                <input className="input-field" type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Número de Tarjeta</label>
                <input className="input-field" value={form.cuenta} onChange={e => setForm({ ...form, cuenta: e.target.value })} placeholder="5200-XXXX-XXXX-XXXX" />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Plan</label>
                <select className="input-field" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })}>
                  <option value="essential">Essential</option>
                  <option value="lifestyle">LifeStyle</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} id="activo" />
                <label htmlFor="activo" style={{ fontSize: "13px", fontWeight: 600 }}>Usuario activo</label>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="submit" className="btn-primary">
                  {editId ? "Guardar cambios" : "Crear usuario"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                  background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
              {["Usuario", "Correo", "Tarjeta", "Plan", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", color: "#9CA3AF", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                <td style={{ padding: "14px", fontWeight: 600, fontSize: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "50%",
                      background: "#E0F7F7", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: 700, color: "#00B4B4"
                    }}>
                      {u.nombres?.[0] || "?"}
                    </div>
                    {u.nombres}
                  </div>
                </td>
                <td style={{ padding: "14px", fontSize: "13px", color: "#6B7280" }}>{u.correo}</td>
                <td style={{ padding: "14px", fontSize: "12px", fontFamily: "monospace", color: "#374151" }}>{u.cuenta || "—"}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{
                    background: (planColor[u.planId] || "#ccc") + "20",
                    color: planColor[u.planId] || "#ccc",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700
                  }}>
                    {planLabel(u.planId)}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <span style={{
                    background: u.activo ? "#D1FAE5" : "#FEE2E2",
                    color: u.activo ? "#059669" : "#DC2626",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700
                  }}>
                    {u.activo ? "✓ Activo" : "✗ Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleEdit(u)} style={{
                      padding: "6px 12px", borderRadius: "8px", border: "none",
                      background: "#E0F7F7", color: "#008A8A", cursor: "pointer", fontSize: "12px", fontWeight: 600
                    }}>Editar</button>
                    <button onClick={() => handleDelete(u.id)} style={{
                      padding: "6px 12px", borderRadius: "8px", border: "none",
                      background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: "12px", fontWeight: 600
                    }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#9CA3AF", padding: "32px", fontSize: "14px" }}>
            No se encontraron usuarios
          </p>
        )}
      </div>
    </div>
  );
}
