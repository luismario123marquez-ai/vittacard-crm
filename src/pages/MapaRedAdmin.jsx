import MapaAliados from "../components/MapaAliados";

export default function MapaRedAdmin() {
  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "Syne", fontSize: "28px", fontWeight: 800 }}>Mapa de la Red</h1>
        <p style={{ color: "#6B7280", marginTop: "4px" }}>Visualiza todos los comercios afiliados y gestiona sus ubicaciones</p>
      </div>

      <div className="card" style={{ padding: "20px", borderRadius: "16px" }}>
        <MapaAliados rol="admin" />
      </div>
    </div>
  );
}
