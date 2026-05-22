import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/usuarios", icon: "👥", label: "Usuarios" },
  { to: "/planes", icon: "📋", label: "Planes" },
  { to: "/aliados", icon: "🤝", label: "Aliados Comerciales" },
  { to: "/mapa-red", icon: "🗺️", label: "Mapa de la Red" },
  { to: "/transacciones", icon: "💳", label: "Transacciones" },
  { to: "/vittadata", icon: "📈", label: "VittaData" },
];

export default function Sidebar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside style={{
      width: "240px", minHeight: "100vh",
      background: "#1A2B3C",
      display: "flex", flexDirection: "column",
      position: "fixed", left: 0, top: 0, bottom: 0,
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>💳</span>
          <div>
            <h2 style={{ fontFamily: "Syne", color: "white", fontSize: "18px", fontWeight: 800, lineHeight: 1 }}>VittaCard</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "2px" }}>CRM Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 14px", borderRadius: "10px",
              textDecoration: "none",
              fontSize: "14px", fontWeight: isActive ? 600 : 400,
              color: isActive ? "white" : "rgba(255,255,255,0.55)",
              background: isActive ? "rgba(0,180,180,0.25)" : "transparent",
              borderLeft: isActive ? "3px solid #00B4B4" : "3px solid transparent",
              transition: "all 0.15s"
            })}
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ marginBottom: "12px" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>Conectado como</p>
          <p style={{ color: "white", fontSize: "12px", fontWeight: 600, wordBreak: "break-all" }}>
            {currentUser?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px", borderRadius: "10px",
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)",
            border: "none", cursor: "pointer", fontSize: "13px",
            transition: "background 0.15s"
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,100,100,0.2)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.08)"}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
