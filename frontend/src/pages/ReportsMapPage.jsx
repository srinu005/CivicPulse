import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { listReports, isLoggedIn, CATEGORY_LABELS, STATUS_COLORS } from "../api/client";
import { color, font, navLinkStyle, buttonPrimary } from "../theme";
import PageNav from "../components/PageNav";

// Leaflet's default marker icon breaks under bundlers like Vite unless
// re-pointed manually -- this is a well-known workaround, not a design choice.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function coloredIcon(color) {
  return new L.DivIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.5)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const DEFAULT_CENTER = [17.385, 78.4867]; // fallback center; real deployments would geolocate the user

export default function ReportsMapPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ category: "", status: "" });

  useEffect(() => {
    setLoading(true);
    listReports(filters)
      .then(setReports)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div style={{ fontFamily: font.body, background: color.paper, minHeight: "100vh" }}>
      <PageNav>
        {isLoggedIn() ? (
          <>
            <Link to="/report/new" style={buttonPrimary}>Report an Issue</Link>
            <Link to="/user" style={navLinkStyle}>My Account</Link>
          </>
        ) : (
          <Link to="/login" style={navLinkStyle}>Login</Link>
        )}
      </PageNav>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 0" }}>
        <h1 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 28, color: color.tealDark, margin: "0 0 18px" }}>
          Reports near you
        </h1>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 16px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={selectStyle}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
        {loading && <span style={{ color: color.inkSoft, fontSize: 14 }}>Loading...</span>}
        {error && <span style={{ color: color.status.rejected, fontSize: 14 }}>{error}</span>}
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", gap: 16, padding: "0 24px 32px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", height: 500, borderRadius: 3, overflow: "hidden", border: `1px solid ${color.line}` }}>
          <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((r) => (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={coloredIcon(STATUS_COLORS[r.status])}>
                <Popup>
                  <strong>{CATEGORY_LABELS[r.category]}</strong><br />
                  Status: {r.status}<br />
                  {r.upvote_count} upvote{r.upvote_count === 1 ? "" : "s"}<br />
                  <Link to={`/reports/${r.id}`}>View details</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <h3 style={{ marginTop: 0, fontFamily: font.display, fontWeight: 500, color: color.ink }}>
            Reports ({reports.length})
          </h3>
          {reports.length === 0 && !loading && <p style={{ color: color.inkSoft }}>No reports match these filters.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map((r) => (
              <Link key={r.id} to={`/reports/${r.id}`} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: color.ink }}>{CATEGORY_LABELS[r.category]}</strong>
                  <span style={{ ...badgeStyle, background: STATUS_COLORS[r.status] }}>{r.status}</span>
                </div>
                <p style={{ margin: "4px 0", color: color.inkSoft, fontSize: 13 }}>
                  {r.address || `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}`}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: color.inkSoft }}>
                  {r.upvote_count} upvote{r.upvote_count === 1 ? "" : "s"} &middot; by {r.reporter}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const selectStyle = { padding: "9px 10px", borderRadius: 3, border: `1.5px solid ${color.line}`, fontFamily: font.body, background: color.paperRaised };
const cardStyle = { display: "block", padding: 14, border: `1px solid ${color.line}`, borderRadius: 3, textDecoration: "none", color: "inherit", background: color.paperRaised };
const badgeStyle = { color: "white", padding: "3px 9px", borderRadius: 3, fontSize: 11, fontWeight: 600, textTransform: "uppercase" };