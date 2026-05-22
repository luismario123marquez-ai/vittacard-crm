import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { theme, toggleTheme, currentUser } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: "240px" }}>
        {/* Top Header Bar for CRM Admin */}
        <header style={{
          background: theme === "dark" ? "#1E293B" : "#fff",
          borderBottom: theme === "dark" ? "1px solid #334155" : "1px solid #E2E8F0",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontFamily: "Syne", color: theme === "dark" ? "#fff" : "#1A2B3C" }}>
            Panel de Administración CRM
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: theme === "dark" ? "#94A3B8" : "#6B7280" }}>
              {currentUser?.email}
            </span>
            <button
              onClick={toggleTheme}
              style={{
                background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                color: theme === "dark" ? "#fff" : "#1E293B",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px"
              }}
            >
              {theme === "dark" ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{
          flex: 1,
          padding: "32px",
          background: theme === "dark" ? "#0F172A" : "#F4F6F8",
          minHeight: "calc(100vh - 60px)"
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
