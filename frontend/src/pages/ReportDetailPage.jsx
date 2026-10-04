import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReport, upvoteReport, isLoggedIn, CATEGORY_LABELS, STATUS_COLORS } from "../api/client";
import { color, font, navLinkStyle } from "../theme";
import PageNav from "../components/PageNav";

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [upvoting, setUpvoting] = useState(false);

  const loadReport = () => {
    getReport(id)
      .then(setReport)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpvote = async () => {
    if (!isLoggedIn()) {
      setError("Log in to upvote this report");
      return;
    }
    setUpvoting(true);
    try {
      await upvoteReport(id);
      loadReport(); // refresh to get the new count + user_has_upvoted state
    } catch (err) {
      setError(err.message);
    } finally {
      setUpvoting(false);
    }
  };

  return (
    <div style={{ fontFamily: font.body, background: color.paper, minHeight: "100vh" }}>
      <PageNav>
        <Link to="/reports" style={navLinkStyle}>Reports Map</Link>
      </PageNav>

      {error && !report ? (
        <div style={containerStyle}><p style={{ color: color.status.rejected }}>{error}</p></div>
      ) : !report ? (
        <div style={containerStyle}><p style={{ color: color.inkSoft }}>Loading...</p></div>
      ) : (
        <div style={containerStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: font.display, fontWeight: 500, fontSize: 28, color: color.ink }}>
              {CATEGORY_LABELS[report.category]}
            </h2>
            <span style={{ ...badgeStyle, background: STATUS_COLORS[report.status] }}>{report.status}</span>
          </div>

          <p style={{ color: color.inkSoft, fontSize: 14, marginTop: 8 }}>
            Reported by {report.reporter} on {new Date(report.created_at).toLocaleDateString()}
            {report.address && <> &middot; {report.address}</>}
          </p>

          {report.photo && (
            <img src={report.photo} alt="Report evidence" style={{ maxWidth: "100%", borderRadius: 3, margin: "16px 0" }} />
          )}

          <p style={{ color: color.ink, fontSize: 15, lineHeight: 1.6 }}>{report.description}</p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "20px 0" }}>
            <button onClick={handleUpvote} disabled={upvoting} style={upvoteButtonStyle(report.user_has_upvoted)}>
              {report.user_has_upvoted ? "Upvoted" : "Upvote"} ({report.upvote_count})
            </button>
            <span style={{ fontSize: 13, color: color.inkSoft }}>Severity: {report.severity}</span>
          </div>

          {error && <p style={{ color: color.status.rejected, fontSize: 14 }}>{error}</p>}

          <h3 style={{ fontFamily: font.display, fontWeight: 500, color: color.tealDark, fontSize: 19, marginTop: 28 }}>
            Status History
          </h3>
          {report.status_updates.length === 0 ? (
            <p style={{ color: color.inkSoft, fontSize: 14 }}>No status changes yet -- this report is still pending review.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {report.status_updates.map((u, i) => (
                <div key={i} style={historyItemStyle}>
                  <strong style={{ color: color.ink }}>{u.old_status} &rarr; {u.new_status}</strong>
                  {u.note && <p style={{ margin: "4px 0", fontSize: 14, color: color.ink }}>{u.note}</p>}
                  <p style={{ margin: 0, fontSize: 12, color: color.inkSoft }}>
                    by {u.updated_by || "unknown"} on {new Date(u.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function upvoteButtonStyle(active) {
  return {
    padding: "9px 18px",
    borderRadius: 20,
    border: active ? "none" : `1.5px solid ${color.teal}`,
    background: active ? color.teal : color.paperRaised,
    color: active ? "white" : color.teal,
    fontWeight: 600,
    fontFamily: font.body,
    cursor: "pointer",
  };
}

const containerStyle = { fontFamily: font.body, maxWidth: 700, margin: "0 auto", padding: "40px 24px" };
const badgeStyle = { color: "white", padding: "4px 11px", borderRadius: 3, fontSize: 12, fontWeight: 600, textTransform: "uppercase", height: "fit-content" };
const historyItemStyle = { padding: 14, background: color.paperRaised, border: `1px solid ${color.line}`, borderRadius: 3, borderLeft: `3px solid ${color.teal}` };