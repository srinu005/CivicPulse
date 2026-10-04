import { Link } from "react-router-dom";
import { navStyle, navBrandStyle } from "../theme";

export default function PageNav({ children }) {
  return (
    <nav style={navStyle}>
      <Link to="/" style={navBrandStyle}>CivicPulse</Link>
      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>{children}</div>
    </nav>
  );
}