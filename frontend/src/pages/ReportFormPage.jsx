import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { createReport, CATEGORY_LABELS } from "../api/client";
import { color, font, navLinkStyle, buttonPrimary, buttonSecondary } from "../theme";
import PageNav from "../components/PageNav";

const DEFAULT_CENTER = [17.385, 78.4867];

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function ReportFormPage() {
  const [form, setForm] = useState({ category: "garbage", description: "", severity: "medium", address: "" });
  const [photo, setPhoto] = useState(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Could not get your location -- click the map to pin it manually instead")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!position) {
      setError("Please set a location -- click the map or use 'Use my location'");
      return;
    }

    setLoading(true);
    try {
      const report = await createReport({
        ...form,
        latitude: position[0],
        longitude: position[1],
        photo,
      });
      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: font.body, background: color.paper, minHeight: "100vh" }}>
      <PageNav>
        <Link to="/reports" style={navLinkStyle}>Reports Map</Link>
        <Link to="/user" style={navLinkStyle}>My Account</Link>
      </PageNav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 30, color: color.tealDark, margin: "0 0 24px" }}>
          Report a Pollution Issue
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <label style={labelStyle}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <label style={labelStyle}>Severity</label>
            <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
              {["low", "medium", "high"].map((s) => (
                <label key={s} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 4, color: color.ink }}>
                  <input type="radio" name="severity" value={s} checked={form.severity === s} onChange={handleChange} />
                  {s[0].toUpperCase() + s.slice(1)}
                </label>
              ))}
            </div>

            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={4} style={{ ...inputStyle, resize: "vertical" }} />

            <label style={labelStyle}>Address (optional)</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="e.g. MG Road, near City Market" style={inputStyle} />

            <label style={labelStyle}>Photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} style={{ marginBottom: 14, fontFamily: font.body, fontSize: 14 }} />

            {error && <p style={{ color: color.status.rejected, fontSize: 14 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ ...buttonPrimary, width: "100%" }}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>

          <div style={{ flex: "1 1 400px" }}>
            <label style={labelStyle}>Location</label>
            <button type="button" onClick={useMyLocation} style={{ ...buttonSecondary, width: "auto", padding: "8px 16px", marginBottom: 10, display: "block" }}>
              Use my location
            </button>
            <div style={{ height: 380, borderRadius: 3, overflow: "hidden", border: `1px solid ${color.line}` }}>
              <MapContainer center={position || DEFAULT_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <p style={{ fontSize: 12, color: color.inkSoft, marginTop: 8 }}>Click anywhere on the map to drop a pin, or use the button above.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: color.tealDark, marginBottom: 5, marginTop: 12 };
const inputStyle = { width: "100%", padding: 10, marginBottom: 6, boxSizing: "border-box", border: `1.5px solid ${color.line}`, borderRadius: 3, fontFamily: font.body, fontSize: 15, background: color.paperRaised };