import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useLocation } from "react-router-dom";

const sectores = ["Salud", "Deporte", "Supermercado", "Restaurante", "Farmacia", "Entretenimiento", "Otro"];

export default function Aliados() {
  const location = useLocation();
  const [aliados, setAliados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nombre: "", nit: "", ubicacion: "", sector: "Salud", activo: true });

  const load = async () => {
    const snap = await getDocs(collection(db, "aliados"));
    setAliados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await updateDoc(doc(db, "aliados", editId), form);
    } else {
      await addDoc(collection(db, "aliados"), { ...form, creadoEn: new Date() });
    }
    setForm({ nombre: "", nit: "", ubicacion: "", sector: "Salud", activo: true });
    setEditId(null);
    setShowForm(false);
    load();
  };

  const handleEdit = (a) => {
    setForm({ nombre: a.nombre, nit: a.nit, ubicacion: a.ubicacion, sector: a.sector, activo: a.activo });
    setEditId(a.id);
    setShowForm(true);
  };

  useEffect(() => {
    if (location.state?.editId && aliados.length > 0) {
      const aliadoParaEditar = aliados.find(a => a.id === location.state.editId);
      if (aliadoParaEditar) {
        handleEdit(aliadoParaEditar);
      }
    }
  }, [location.state, aliados]);

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este aliado?")) {
      await deleteDoc(doc(db, "aliados", id));
      load();
    }
  };

  const sectorColors = {
    Salud: "#00B4B4", Deporte: "#7C3AED", Supermercado: "#F59E0B",
    Restaurante: "#EF4444", Farmacia: "#10B981", Entretenimiento: "#3B82F6", Otro: "#6B7280"
  };

  const filtered = aliados.filter(a =>
    a.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    a.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Aliados Comerciales</h1>
          <p style={{ color: "#6B7280", marginTop: "4px" }}>Negocios con convenio activo en VittaCard</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ nombre: "", nit: "", ubicacion: "", sector: "Salud", activo: true }); }}
          style={{ background: "#00B4B4", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}
        >
          + Nuevo Aliado
        </button>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div className="card" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "28px" }}>🤝</span>
          <div>
            <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800 }}>{aliados.length}</div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Total aliados</div>
          </div>
        </div>
        <div className="card" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "28px" }}>✅</span>
          <div>
            <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, color: "#059669" }}>
              {aliados.filter(a => a.activo).length}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Aliados activos</div>
          </div>
        </div>
        <div className="card" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "28px" }}>📍</span>
          <div>
            <div style={{ fontFamily: "Syne", fontSize: "24px", fontWeight: 800, color: "#DC2626" }}>
              {aliados.filter(a => !a.activo).length}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280" }}>Sin convenio activo</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <input
          className="input-field"
          placeholder="🔍  Buscar por nombre o sector..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200
        }}>
          <div className="card" style={{ width: "480px" }}>
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "20px" }}>
              {editId ? "Editar Aliado" : "Nuevo Aliado Comercial"}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Nombre del Negocio</label>
                <input className="input-field" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>NIT</label>
                <input className="input-field" value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} placeholder="900000000-1" />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Ubicación</label>
                <input className="input-field" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Cra X # X-XX" />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Sector</label>
                <select className="input-field" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}>
                  {sectores.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} id="activoAliado" />
                <label htmlFor="activoAliado" style={{ fontSize: "13px", fontWeight: 600 }}>Convenio activo</label>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="submit" className="btn-primary">
                  {editId ? "Guardar cambios" : "Registrar aliado"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                  background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {filtered.map(a => (
          <div key={a.id} className="card" style={{ borderLeft: `4px solid ${sectorColors[a.sector] || "#6B7280"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{
                background: (sectorColors[a.sector] || "#6B7280") + "20",
                color: sectorColors[a.sector] || "#6B7280",
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700
              }}>{a.sector}</span>
              <span style={{
                background: a.activo ? "#D1FAE5" : "#FEE2E2",
                color: a.activo ? "#059669" : "#DC2626",
                padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700
              }}>{a.activo ? "Activo" : "Inactivo"}</span>
            </div>
            <h3 style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{a.nombre}</h3>
            <p style={{ fontSize: "12px", color: "#6B7280", marginBottom: "4px" }}>📍 {a.ubicacion}</p>
            <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "16px" }}>NIT: {a.nit}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => handleEdit(a)} style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                background: "#E0F7F7", color: "#008A8A", cursor: "pointer", fontSize: "12px", fontWeight: 600
              }}>✏️ Editar</button>
              <button onClick={() => handleDelete(a.id)} style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "none",
                background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: "12px", fontWeight: 600
              }}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ color: "#9CA3AF" }}>No se encontraron aliados</p>
        </div>
      )}
    </div>
  );
}
