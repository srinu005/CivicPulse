// Shared design tokens for CivicPulse.
// Palette: deep teal (trust, environment) + warm ochre (hazard/attention accent)
// on a warm paper background -- deliberately not the generic cream+terracotta
// or SaaS-card look; grounded in civic/environmental subject matter.

export const color = {
  ink: "#1A1A17",
  inkSoft: "#4A4A42",
  paper: "#F6F4EE",
  paperRaised: "#FFFFFF",
  line: "#DEDACD",

  teal: "#1F4B4A",
  tealDark: "#15302F",
  tealTint: "#E3EDEC",

  ochre: "#C9842F",
  ochreTint: "#F6E8D5",

  status: {
    pending: "#C9842F",
    in_progress: "#2B6CA3",
    resolved: "#2E7D5B",
    rejected: "#B3493D",
  },
};

export const font = {
  display: "'Fraunces', Georgia, serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Reusable style fragments (plain objects, spread into component inline styles)
export const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "18px 32px",
  borderBottom: `1px solid ${color.line}`,
  background: color.paper,
  fontFamily: font.body,
};

export const navBrandStyle = {
  fontFamily: font.display,
  fontWeight: 600,
  fontSize: 21,
  color: color.tealDark,
  textDecoration: "none",
  letterSpacing: "-0.01em",
};

export const navLinkStyle = {
  color: color.inkSoft,
  textDecoration: "none",
  fontWeight: 500,
  fontSize: 14,
};

export const buttonPrimary = {
  display: "inline-block",
  padding: "12px 26px",
  background: color.teal,
  color: color.paper,
  border: "none",
  borderRadius: 3,
  fontFamily: font.body,
  fontWeight: 600,
  fontSize: 15,
  textDecoration: "none",
  cursor: "pointer",
};

export const buttonSecondary = {
  ...buttonPrimary,
  background: "transparent",
  color: color.tealDark,
  border: `1.5px solid ${color.teal}`,
};