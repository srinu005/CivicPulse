import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReport, upvoteReport, isLoggedIn, CATEGORY_LABELS, STATUS_COLORS } from "../api/client";

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

  if (error && !report) return <div style={containerStyle}><p style={{ color: "crimson" }}>{error}</p></div>;
  if (!report) return <div style={containerStyle}><p>Loading...</p></div>;

  return (
    <div style={containerStyle}>
      <Link to="/reports" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>&larr; Back to map</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12 }}>
        <h2 style={{ margin: 0 }}>{CATEGORY_LABELS[report.category]}</h2>
        <span style={{ ...badgeStyle, background: STATUS_COLORS[report.status] }}>{report.status}</span>
      </div>

      <p style={{ color: "#64748b", fontSize: 14 }}>
        Reported by {report.reporter} on {new Date(report.created_at).toLocaleDateString()}
        {report.address && <> &middot; {report.address}</>}
      </p>

      {report.photo && (
        <img src={report.photo} alt="Report evidence" style={{ maxWidth: "100%", borderRadius: 8, margin: "12px 0" }} />
      )}

      <p>{report.description}</p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
        <button onClick={handleUpvote} disabled={upvoting} style={upvoteButtonStyle(report.user_has_upvoted)}>
          {report.user_has_upvoted ? "Upvoted" : "Upvote"} ({report.upvote_count})
        </button>
        <span style={{ fontSize: 13, color: "#64748b" }}>Severity: {report.severity}</span>
      </div>

      {error && <p style={{ color: "crimson", fontSize: 14 }}>{error}</p>}

      <h3>Status History</h3>
      {report.status_updates.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 14 }}>No status changes yet -- this report is still pending review.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {report.status_updates.map((u, i) => (
            <div key={i} style={historyItemStyle}>
              <strong>{u.old_status} &rarr; {u.new_status}</strong>
              {u.note && <p style={{ margin: "4px 0", fontSize: 14 }}>{u.note}</p>}
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                by {u.updated_by || "unknown"} on {new Date(u.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function upvoteButtonStyle(active) {
  return {
    padding: "8px 16px",
    borderRadius: 20,
    border: active ? "none" : "1px solid #2563eb",
    background: active ? "#2563eb" : "white",
    color: active ? "white" : "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
  };
}

const containerStyle = { fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 24 };
const badgeStyle = { color: "white", padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600, textTransform: "uppercase", height: "fit-content" };
const historyItemStyle = { padding: 12, background: "#f8fafc", borderRadius: 8, borderLeft: "3px solid #2563eb" };