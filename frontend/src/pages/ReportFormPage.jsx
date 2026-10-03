import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { createReport, CATEGORY_LABELS } from "../api/client";

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
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <Link to="/reports" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>&larr; Back to map</Link>
      <h2>Report a Pollution Issue</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
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
              <label key={s} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
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
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} style={{ marginBottom: 14 }} />

          {error && <p style={{ color: "crimson" }}>{error}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>

        <div style={{ flex: "1 1 400px" }}>
          <label style={labelStyle}>Location</label>
          <button type="button" onClick={useMyLocation} style={{ ...buttonStyle, background: "#fff", color: "#2563eb", border: "1px solid #2563eb", marginBottom: 8, width: "auto", padding: "6px 14px" }}>
            Use my location
          </button>
          <div style={{ height: 380, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <MapContainer center={position || DEFAULT_CENTER} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          <p style={{ fontSize: 12, color: "#64748b" }}>Click anywhere on the map to drop a pin, or use the button above.</p>
        </div>
      </form>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4, marginTop: 10 };
const inputStyle = { width: "100%", padding: 10, marginBottom: 6, boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 4, fontFamily: "inherit" };
const buttonStyle = { width: "100%", padding: 10, background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 };