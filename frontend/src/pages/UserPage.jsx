import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, clearTokens, isLoggedIn } from "../api/client";
import { color, font, navStyle, navBrandStyle, navLinkStyle } from "../theme";

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

  if (error) return <Shell><p style={{ color: color.status.rejected }}>{error}</p></Shell>;
  if (!user) return <Shell><p style={{ color: color.inkSoft }}>Loading...</p></Shell>;

  const roleLabel = { citizen: "Citizen", officer: "Officer", admin: "Super Admin" }[user.role];
  const roleColor = { citizen: color.teal, officer: color.status.resolved, admin: color.ochre }[user.role];

  return (
    <Shell>
      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ ...avatarStyle, background: roleColor }}>{user.username[0].toUpperCase()}</div>
          <div>
            <h2 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 26, margin: 0, color: color.ink }}>
              {user.username}
            </h2>
            <p style={{ margin: "4px 0 0", color: color.inkSoft, fontSize: 14 }}>{user.email}</p>
          </div>
          <span style={{ ...badgeStyle, background: roleColor, marginLeft: "auto" }}>{roleLabel}</span>
        </div>

        {user.role === "officer" && user.officer_profile && (
          <div style={officerBoxStyle}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 13, color: color.tealDark, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Officer details
            </p>
            <DetailRow label="Designation" value={user.officer_profile.designation} />
            <DetailRow label="Department" value={user.officer_profile.department} />
            <DetailRow label="Jurisdiction" value={user.officer_profile.jurisdiction_area} />
          </div>
        )}

        {user.role === "citizen" && (
          <p style={{ color: color.inkSoft, fontSize: 15, lineHeight: 1.6, marginTop: 18 }}>
            Spotted a pollution issue nearby? File a report with a photo and location, and track it through
            to resolution right here.
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          <Link to="/reports" style={linkButtonStyle(color.teal)}>View Reports Map</Link>
          {user.role === "citizen" && (
            <Link to="/report/new" style={linkButtonStyle(color.teal)}>+ Report an Issue</Link>
          )}
          {(user.role === "officer" || user.role === "admin") && (
            <Link to="/dashboard" style={linkButtonStyle(color.status.resolved)}>Officer Dashboard</Link>
          )}
          {user.role === "admin" && (
            <Link to="/admin/officers" style={linkButtonStyle(color.ochre)}>Manage Officers</Link>
          )}
        </div>

        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div style={{ fontFamily: font.body, background: color.paper, minHeight: "100vh" }}>
      <nav style={navStyle}>
        <Link to="/" style={navBrandStyle}>CivicPulse</Link>
        <Link to="/reports" style={navLinkStyle}>Reports Map</Link>
      </nav>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px" }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
      <span style={{ color: color.inkSoft }}>{label}</span>
      <span style={{ color: color.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const cardStyle = {
  background: color.paperRaised,
  border: `1px solid ${color.line}`,
  borderRadius: 4,
  padding: 32,
};

const avatarStyle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  color: "white",
  fontFamily: "'Fraunces', serif",
  fontSize: 22,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const badgeStyle = {
  color: "white",
  padding: "4px 12px",
  borderRadius: 3,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const officerBoxStyle = {
  background: color.tealTint,
  borderRadius: 3,
  padding: "14px 16px",
  marginTop: 20,
};

const logoutButtonStyle = {
  marginTop: 22,
  padding: "9px 20px",
  background: "transparent",
  color: color.status.rejected,
  border: `1.5px solid ${color.status.rejected}`,
  borderRadius: 3,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 14,
  fontFamily: font.body,
};

function linkButtonStyle(bg) {
  return {
    padding: "9px 18px",
    background: bg,
    color: "white",
    borderRadius: 3,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
    fontFamily: font.body,
  };
}