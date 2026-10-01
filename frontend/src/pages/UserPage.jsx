import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, clearTokens, isLoggedIn } from "../api/client";

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        setError("Session expired, please log in again");
        clearTokens();
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    clearTokens();
    navigate("/");
  };

  if (error) return <p style={containerStyle}>{error}</p>;
  if (!user) return <p style={containerStyle}>Loading...</p>;

  const roleLabel = { citizen: "Citizen", officer: "Officer", admin: "Super Admin" }[user.role];

  return (
    <div style={containerStyle}>
      <h2>Welcome, {user.username}</h2>
      <p>Email: {user.email}</p>
      <p>
        Role: <span style={badgeStyle(user.role)}>{roleLabel}</span>
      </p>

      {user.role === "officer" && user.officer_profile && (
        <div style={officerBoxStyle}>
          <strong>Officer details</strong>
          <p>Designation: {user.officer_profile.designation}</p>
          <p>Department: {user.officer_profile.department}</p>
          <p>Jurisdiction: {user.officer_profile.jurisdiction_area}</p>
        </div>
      )}

      {user.role === "citizen" && (
        <p style={{ color: "#64748b" }}>You can submit and track pollution reports here (coming in Phase 2).</p>
      )}

      <button onClick={handleLogout} style={buttonStyle}>Logout</button>
    </div>
  );
}

function badgeStyle(role) {
  const colors = { citizen: "#2563eb", officer: "#16a34a", admin: "#d97706" };
  return {
    background: colors[role] || "#64748b",
    color: "white",
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
  };
}

const containerStyle = { maxWidth: 420, margin: "80px auto", textAlign: "center", fontFamily: "sans-serif" };
const officerBoxStyle = { background: "#f1f5f9", borderRadius: 8, padding: 16, margin: "16px 0", textAlign: "left" };
const buttonStyle = { marginTop: 16, padding: "10px 24px", background: "crimson", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 };