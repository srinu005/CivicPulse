import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#1e3a5f" }}>CivicPulse</h1>
      <p style={{ color: "#475569" }}>
        Report pollution issues in your area and track them through to resolution.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
        <Link to="/login" style={buttonStyle}>Login</Link>
        <Link to="/register" style={{ ...buttonStyle, background: "#fff", color: "#2563eb", border: "1px solid #2563eb" }}>
          Register
        </Link>
      </div>
    </div>
  );
}

const containerStyle = { maxWidth: 420, margin: "100px auto", textAlign: "center", fontFamily: "sans-serif" };
const buttonStyle = { padding: "10px 24px", background: "#2563eb", color: "white", borderRadius: 6, textDecoration: "none", fontWeight: 600 };