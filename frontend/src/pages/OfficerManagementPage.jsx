import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCurrentUser, listOfficers, createOfficer, isLoggedIn, DESIGNATION_LABELS,
} from "../api/client";

const EMPTY_FORM = {
  username: "", email: "", password: "",
  designation: "MRO", department: "", jurisdiction_area: "", official_email: "",
};

export default function OfficerManagementPage() {
  const [user, setUser] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadOfficers = () => {
    listOfficers().then(setOfficers).catch((err) => setError(err.message));
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    getCurrentUser()
      .then((u) => {
        if (u.role !== "admin") {
          navigate("/user"); // only Super Admins reach this page
          return;
        }
        setUser(u);
        loadOfficers();
      })
      .catch(() => navigate("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const created = await createOfficer(form);
      setSuccess(`Officer account created for ${created.username} (${created.designation}).`);
      setForm(EMPTY_FORM);
      loadOfficers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading...</div>;

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={navStyle}>
        <Link to="/" style={{ fontWeight: 700, color: "#1e3a5f", textDecoration: "none" }}>CivicPulse Admin</Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link to="/dashboard" style={navLinkStyle}>Reports Dashboard</Link>
          <Link to="/user" style={navLinkStyle}>My Account</Link>
        </div>
      </nav>

      <div style={{ padding: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <h2 style={{ marginTop: 0 }}>Provision a New Officer</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            This is the only way an officer account can be created -- officers cannot self-register.
            Use the officer's verified official email and designation.
          </p>

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Username</label>
            <input name="username" value={form.username} onChange={handleChange} required minLength={3} style={inputStyle} />

            <label style={labelStyle}>Login Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} />

            <label style={labelStyle}>Temporary Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={8} style={inputStyle} />

            <label style={labelStyle}>Designation</label>
            <select name="designation" value={form.designation} onChange={handleChange} style={inputStyle}>
              {Object.entries(DESIGNATION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <label style={labelStyle}>Department</label>
            <input name="department" value={form.department} onChange={handleChange} required placeholder="e.g. Revenue" style={inputStyle} />

            <label style={labelStyle}>Jurisdiction Area</label>
            <input name="jurisdiction_area" value={form.jurisdiction_area} onChange={handleChange} required placeholder="e.g. Ward 5" style={inputStyle} />

            <label style={labelStyle}>Official Email (verification)</label>
            <input name="official_email" type="email" value={form.official_email} onChange={handleChange} required placeholder="name@gov.in" style={inputStyle} />

            {error && <p style={{ color: "crimson", fontSize: 14 }}>{error}</p>}
            {success && <p style={{ color: "#16a34a", fontSize: 14 }}>{success}</p>}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Creating..." : "Create Officer Account"}
            </button>
          </form>
        </div>

        <div style={{ flex: "1 1 420px" }}>
          <h2 style={{ marginTop: 0 }}>Provisioned Officers ({officers.length})</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Designation</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Jurisdiction</th>
                  <th style={thStyle}>Official Email</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={tdStyle}>{o.username}</td>
                    <td style={tdStyle}>{o.designation}</td>
                    <td style={tdStyle}>{o.department}</td>
                    <td style={tdStyle}>{o.jurisdiction_area}</td>
                    <td style={tdStyle}>{o.official_email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {officers.length === 0 && <p style={{ color: "#64748b" }}>No officers provisioned yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #e2e8f0" };
const navLinkStyle = { color: "#2563eb", textDecoration: "none", fontWeight: 600, fontSize: 14 };
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 4, marginTop: 10 };
const inputStyle = { width: "100%", padding: 9, marginBottom: 6, boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 4, fontFamily: "inherit" };
const buttonStyle = { width: "100%", padding: 10, background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, marginTop: 10 };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thStyle = { padding: "8px 10px", fontSize: 11, color: "#64748b", textTransform: "uppercase" };
const tdStyle = { padding: "8px 10px" };