import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/client";
import { color, font, navLinkStyle, buttonPrimary } from "../theme";
import PageNav from "../components/PageNav";

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
    <div style={{ fontFamily: font.body, background: color.paper, minHeight: "100vh" }}>
      <PageNav>
        <Link to="/login" style={navLinkStyle}>Login instead</Link>
      </PageNav>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 30, color: color.tealDark, margin: "0 0 8px" }}>
          Create an account
        </h2>
        <p style={{ color: color.inkSoft, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Open to everyone. Officer accounts are provisioned separately and cannot be created here.
        </p>

        <form onSubmit={handleSubmit}>
          <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required minLength={3} style={inputStyle} />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required style={inputStyle} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={8} style={inputStyle} />
          <button type="submit" disabled={loading} style={{ ...buttonPrimary, width: "100%", marginTop: 6 }}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>
        {error && <p style={{ color: color.status.rejected, fontSize: 14, marginTop: 14 }}>{error}</p>}
        <p style={{ marginTop: 20 }}><Link to="/" style={navLinkStyle}>Back to home</Link></p>
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 11,
  marginBottom: 12,
  boxSizing: "border-box",
  border: `1.5px solid ${color.line}`,
  borderRadius: 3,
  fontFamily: font.body,
  fontSize: 15,
  background: color.paperRaised,
};