import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/client";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Create an account</h2>
      <p style={{ color: "#64748b", fontSize: 14 }}>
        Open to everyone. Officer accounts are provisioned separately and cannot be created here.
      </p>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required minLength={3} style={inputStyle} />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={inputStyle} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={8} style={inputStyle} />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p><Link to="/">Back to home</Link></p>
    </div>
  );
}

const containerStyle = { maxWidth: 340, margin: "60px auto", fontFamily: "sans-serif" };
const inputStyle = { display: "block", width: "100%", padding: 10, marginBottom: 10, boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 4 };
const buttonStyle = { width: "100%", padding: 10, background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 };