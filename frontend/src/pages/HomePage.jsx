import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../api/client";
import { color, font, navStyle, navBrandStyle, navLinkStyle, buttonPrimary, buttonSecondary } from "../theme";

const HERO_IMAGE = "https://images.unsplash.com/photo-1741941752058-82ae6879be5e?fm=jpg&q=80&w=1400&auto=format&fit=crop";
const CLEANUP_IMAGE = "https://images.unsplash.com/photo-1758599668508-d8ec9eca1be3?fm=jpg&q=80&w=1400&auto=format&fit=crop";

const STEPS = [
  {
    n: "1",
    title: "Spot it, report it",
    body: "See garbage piling up, a polluted drain, or smoke from a yard fire? Pin the exact location, add a photo, and describe what you saw -- takes under two minutes.",
  },
  {
    n: "2",
    title: "Your neighbors back it up",
    body: "Reports go straight onto a public map. Other residents can upvote issues they see too, so the most urgent problems rise to the top.",
  },
  {
    n: "3",
    title: "A verified officer resolves it",
    body: "Only accounts provisioned by a Super Admin -- real MDOs, MROs, and department officers -- can act on a report. Every status change is logged and you're notified by email.",
  },
];

export default function HomePage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    listReports()
      .then((reports) => {
        const resolved = reports.filter((r) => r.status === "resolved").length;
        const categories = new Set(reports.map((r) => r.category)).size;
        setStats({ total: reports.length, resolved, categories });
      })
      .catch(() => setStats({ total: 0, resolved: 0, categories: 0 }));
  }, []);

  return (
    <div style={{ fontFamily: font.body, background: color.paper, color: color.ink, minHeight: "100vh" }}>
      <nav style={navStyle}>
        <Link to="/" style={navBrandStyle}>CivicPulse</Link>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <Link to="/reports" style={navLinkStyle}>Reports Map</Link>
          <Link to="/login" style={navLinkStyle}>Login</Link>
          <Link to="/register" style={buttonPrimary}>Report an Issue</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ display: "flex", flexWrap: "wrap", maxWidth: 1180, margin: "0 auto", padding: "64px 32px 48px", gap: 48, alignItems: "center" }}>
        <div style={{ flex: "1 1 420px" }}>
          <h1 style={{ fontFamily: font.display, fontSize: "clamp(34px, 4.6vw, 54px)", lineHeight: 1.08, fontWeight: 500, margin: 0, color: color.tealDark }}>
            Report what's hurting your neighborhood.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: color.inkSoft, maxWidth: 460, marginTop: 22 }}>
            Garbage, polluted water, smoke, noise -- CivicPulse turns what you see on your street into a
            public record that a verified local officer is accountable for resolving.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
            <Link to="/register" style={buttonPrimary}>Report an Issue</Link>
            <Link to="/reports" style={buttonSecondary}>View the Map</Link>
          </div>
        </div>

        <div style={{ flex: "1 1 420px", position: "relative" }}>
          <img
            src={HERO_IMAGE}
            alt="A city skyline obscured by smog"
            style={{ width: "100%", display: "block", borderRadius: 2, aspectRatio: "4 / 3", objectFit: "cover" }}
          />
          <p style={{ fontSize: 13, color: color.inkSoft, marginTop: 10, borderLeft: `2px solid ${color.ochre}`, paddingLeft: 10 }}>
            Air pollution over a city skyline. Most residents see problems like this long before any authority does.
          </p>
        </div>
      </section>

      {/* Live stats band */}
      <section style={{ borderTop: `1px solid ${color.line}`, borderBottom: `1px solid ${color.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px", display: "flex", gap: 48, flexWrap: "wrap" }}>
          <Stat value={stats ? stats.total : "--"} label="Reports filed" />
          <Stat value={stats ? stats.resolved : "--"} label="Resolved by officers" />
          <Stat value={stats ? stats.categories : "--"} label="Issue categories tracked" />
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 32px" }}>
        <h2 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 28, color: color.tealDark, margin: "0 0 36px" }}>
          How a report gets resolved
        </h2>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ flex: "1 1 280px" }}>
              <div style={{ fontFamily: font.display, fontSize: 40, color: color.ochre, lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "10px 0 8px", color: color.ink }}>{s.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: color.inkSoft, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparency band with second photo */}
      <section style={{ background: color.tealDark, color: color.paper }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 32px", display: "flex", gap: 48, flexWrap: "wrap", alignItems: "center" }}>
          <img
            src={CLEANUP_IMAGE}
            alt="Volunteers collecting litter outdoors"
            style={{ flex: "1 1 360px", width: "100%", maxWidth: 440, borderRadius: 2, aspectRatio: "4 / 3", objectFit: "cover" }}
          />
          <div style={{ flex: "1 1 360px" }}>
            <h2 style={{ fontFamily: font.display, fontWeight: 500, fontSize: 26, margin: "0 0 14px" }}>
              Every report is public record.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: "#CFE0DE", maxWidth: 440 }}>
              No report disappears into an inbox. Status, who's responsible, and what was done are visible
              to anyone -- citizen, officer, or Super Admin -- from the moment it's filed to the moment it's closed.
            </p>
            <Link to="/reports" style={{ ...buttonPrimary, background: color.ochre, color: color.tealDark, marginTop: 10, display: "inline-block" }}>
              Browse the public map
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 32px", textAlign: "center", fontSize: 13, color: color.inkSoft }}>
        CivicPulse -- a civic reporting platform for local pollution issues.
      </footer>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: font.display, fontSize: 30, color: color.teal, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: color.inkSoft, marginTop: 4 }}>{label}</div>
    </div>
  );
}