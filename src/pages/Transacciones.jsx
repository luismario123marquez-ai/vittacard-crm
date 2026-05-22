import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";

const categorias = ["Salud", "Deporte", "Alimentos", "Farmacia", "Entretenimiento", "Transporte", "Otro"];

export default function Transacciones() {
  const [txs, setTxs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [aliados, setAliados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ usuarioNombre: "", comercio: "", monto: "", categoria: "Salud", estado: "completada" });

  const load = async () => {
    const [tSnap, uSnap, aSnap] = await Promise.all([
      getDocs(collection(db, "transacciones")),
      getDocs(collection(db, "usuarios")),
      getDocs(collection(db, "aliados")),
    ]);
    setTxs(tSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
      const dateA = a.fecha?.toDate?.() || new Date(a.fecha) || 0;
      const dateB = b.fecha?.toDate?.() || new Date(b.fecha) || 0;
      return dateB - dateA;
    }));
    setUsuarios(uSnap.docs.map(d => d.data()));
    setAliados(aSnap.docs.map(d => d.data()));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "transacciones"), {
      ...form,
      monto: Number(form.monto),
      fecha: new Date(),
    });
    setForm({ usuarioNombre: "", comercio: "", monto: "", categoria: "Salud", estado: "completada" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar esta transacción?")) {
      await deleteDoc(doc(db, "transacciones", id));
      load();
    }
  };

  const totalVolumen = txs.reduce((s, t) => s + (t.monto || 0), 0);
  const filtered = txs.filter(t =>
    t.usuarioNombre?.toLowerCase().includes(search.toLowerCase()) ||
    t.comercio?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (fecha) => {
    if (!fecha) return "—";
    const d = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Transacciones</h1>
          <p style={{ color: "#6B7280", marginTop: "4px" }}>Historial de pagos y movimientos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: "#00B4B4", color: "white", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}
        >
          + Registrar Transacción
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div className="card" style={{ borderTop: "4px solid #00B4B4" }}>
          <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>{txs.length}</div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Total transacciones</div>
        </div>
        <div className="card" style={{ borderTop: "4px solid #7C3AED" }}>
          <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>${totalVolumen.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Volumen total procesado</div>
        </div>
        <div className="card" style={{ borderTop: "4px solid #F59E0B" }}>
          <div style={{ fontFamily: "Syne", fontSize: "26px", fontWeight: 800 }}>
            ${txs.length ? Math.round(totalVolumen / txs.length).toLocaleString() : 0}
          </div>
          <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>Promedio por transacción</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <input
          className="input-field"
          placeholder="🔍  Buscar por usuario o comercio..."
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
            <h3 style={{ fontFamily: "Syne", fontSize: "18px", marginBottom: "20px" }}>Nueva Transacción</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Usuario</label>
                <select className="input-field" value={form.usuarioNombre} onChange={e => setForm({ ...form, usuarioNombre: e.target.value })} required>
                  <option value="">Seleccionar usuario...</option>
                  {usuarios.map((u, i) => <option key={i} value={u.nombres}>{u.nombres}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Comercio / Aliado</label>
                <select className="input-field" value={form.comercio} onChange={e => setForm({ ...form, comercio: e.target.value })} required>
                  <option value="">Seleccionar comercio...</option>
                  {aliados.map((a, i) => <option key={i} value={a.nombre}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Monto ($)</label>
                <input className="input-field" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} required min="1" />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "5px" }}>Categoría</label>
                <select className="input-field" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="submit" className="btn-primary">Registrar transacción</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: "12px", border: "2px solid #E5E7EB", borderRadius: "10px",
                  background: "white", cursor: "pointer", fontWeight: 600, color: "#6B7280"
                }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #F3F4F6" }}>
              {["Usuario", "Comercio", "Categoría", "Monto", "Fecha", "Estado", ""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "12px", color: "#9CA3AF", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                <td style={{ padding: "14px", fontWeight: 600, fontSize: "13px" }}>{tx.usuarioNombre}</td>
                <td style={{ padding: "14px", fontSize: "13px", color: "#6B7280" }}>{tx.comercio}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#E0F7F7", color: "#008A8A", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                    {tx.categoria}
                  </span>
                </td>
                <td style={{ padding: "14px", fontFamily: "Syne", fontWeight: 800, color: "#1A2B3C" }}>
                  ${tx.monto?.toLocaleString()}
                </td>
                <td style={{ padding: "14px", fontSize: "12px", color: "#9CA3AF" }}>{formatDate(tx.fecha)}</td>
                <td style={{ padding: "14px" }}>
                  <span style={{ background: "#D1FAE5", color: "#059669", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>
                    ✓ {tx.estado}
                  </span>
                </td>
                <td style={{ padding: "14px" }}>
                  <button onClick={() => handleDelete(tx.id)} style={{
                    padding: "6px 10px", borderRadius: "8px", border: "none",
                    background: "#FEE2E2", color: "#DC2626", cursor: "pointer", fontSize: "12px"
                  }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: "#9CA3AF", padding: "32px", fontSize: "14px" }}>
            No se encontraron transacciones
          </p>
        )}
      </div>
    </div>
  );
}
