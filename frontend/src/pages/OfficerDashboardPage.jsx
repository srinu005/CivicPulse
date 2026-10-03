import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  getCurrentUser, getDashboardStats, listReports, updateReportStatus,
  isLoggedIn, CATEGORY_LABELS, STATUS_COLORS,
} from "../api/client";

const VALID_NEXT = {
  pending: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

export default function OfficerDashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ category: "", status: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([getDashboardStats(), listReports(filters)])
      .then(([statsData, reportsData]) => {
        setStats(statsData);
        setReports(reportsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    getCurrentUser()
      .then((u) => {
        if (u.role !== "officer" && u.role !== "admin") {
          navigate("/user"); // not an officer -- send them back to the regular user page
          return;
        }
        setUser(u);
      })
      .catch(() => navigate("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  if (!user) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading...</div>;

  const categoryChartData = stats
    ? Object.entries(stats.category_counts).map(([key, count]) => ({ name: CATEGORY_LABELS[key] || key, count }))
    : [];

  const trendChartData = stats
    ? stats.resolution_trend.map((t) => ({ week: t.week_start.slice(5), resolved: t.resolved }))
    : [];

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={navStyle}>
        <Link to="/" style={{ fontWeight: 700, color: "#1e3a5f", textDecoration: "none" }}>CivicPulse Admin</Link>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#475569" }}>{user.username} ({user.officer_profile?.designation})</span>
          <Link to="/reports" style={navLinkStyle}>Public Map</Link>
          <Link to="/user" style={navLinkStyle}>My Account</Link>
        </div>
      </nav>

      <div style={{ padding: 24 }}>
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {/* --- Stat cards --- */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          <StatCard label="Pending" value={stats?.status_counts.pending} color="#d97706" />
          <StatCard label="In Progress" value={stats?.status_counts.in_progress} color="#2563eb" />
          <StatCard label="Resolved" value={stats?.status_counts.resolved} color="#16a34a" />
          <StatCard label="Rejected" value={stats?.status_counts.rejected} color="#dc2626" />
          <StatCard label="Avg. Resolution" value={stats?.avg_resolution_days != null ? `${stats.avg_resolution_days}d` : "--"} color="#64748b" />
        </div>

        {/* --- Charts --- */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div style={chartBoxStyle}>
            <h4 style={{ marginTop: 0 }}>Reports by Category</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={chartBoxStyle}>
            <h4 style={{ marginTop: 0 }}>Resolution Trend (last 6 weeks)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Filters --- */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={selectStyle}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={selectStyle}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          {loading && <span style={{ fontSize: 13, color: "#64748b" }}>Loading...</span>}
        </div>

        {/* --- Reports table --- */}
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Area</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Upvotes</th>
                <th style={thStyle}>Reported by</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} onUpdated={loadAll} />
              ))}
            </tbody>
          </table>
          {reports.length === 0 && !loading && <p style={{ color: "#64748b", padding: 16 }}>No reports match these filters.</p>}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ report, onUpdated }) {
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState("");

  const options = VALID_NEXT[report.status] || [];

  const handleUpdate = async () => {
    if (!nextStatus) return;
    setSaving(true);
    setRowError("");
    try {
      await updateReportStatus(report.id, nextStatus, note);
      setNote("");
      setNextStatus("");
      onUpdated();
    } catch (err) {
      setRowError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={tdStyle}><Link to={`/reports/${report.id}`}>#{report.id}</Link></td>
      <td style={tdStyle}>{CATEGORY_LABELS[report.category]}</td>
      <td style={tdStyle}>{report.address || `${report.latitude.toFixed(2)}, ${report.longitude.toFixed(2)}`}</td>
      <td style={tdStyle}><span style={{ ...badgeStyle, background: STATUS_COLORS[report.status] }}>{report.status}</span></td>
      <td style={tdStyle}>{report.upvote_count}</td>
      <td style={tdStyle}>{report.reporter}</td>
      <td style={tdStyle}>
        {options.length === 0 ? (
          <span style={{ color: "#94a3b8", fontSize: 13 }}>Final state</span>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} style={{ ...selectStyle, padding: "4px 6px", fontSize: 13 }}>
              <option value="">Update to...</option>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              placeholder="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ padding: "4px 6px", fontSize: 13, border: "1px solid #cbd5e1", borderRadius: 4, width: 110 }}
            />
            <button onClick={handleUpdate} disabled={!nextStatus || saving} style={updateButtonStyle}>
              {saving ? "..." : "Save"}
            </button>
          </div>
        )}
        {rowError && <div style={{ color: "crimson", fontSize: 12 }}>{rowError}</div>}
      </td>
    </tr>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...statCardStyle, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{value ?? "--"}</div>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
    </div>
  );
}

const navStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: "1px solid #e2e8f0" };
const navLinkStyle = { color: "#2563eb", textDecoration: "none", fontWeight: 600, fontSize: 14 };
const selectStyle = { padding: 8, borderRadius: 4, border: "1px solid #cbd5e1" };
const statCardStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "14px 20px", minWidth: 120, textAlign: "center" };
const chartBoxStyle = { flex: "1 1 360px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thStyle = { padding: "8px 10px", fontSize: 12, color: "#64748b", textTransform: "uppercase" };
const tdStyle = { padding: "10px 10px" };
const badgeStyle = { color: "white", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, textTransform: "uppercase" };
const updateButtonStyle = { padding: "4px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 600 };