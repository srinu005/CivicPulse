const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Centralized place for every backend call -- components never call fetch() directly
async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = localStorage.getItem("access_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // DRF validation errors come back as { field: ["message"] } -- flatten them
    const message = Object.values(data).flat().join(" ") || "Request failed";
    throw new Error(message);
  }

  return data;
}

// --- Citizen auth ---
export const registerUser = (form) =>
  apiRequest("/api/register/", { method: "POST", body: form });

export const loginUser = (form) =>
  apiRequest("/api/token/", { method: "POST", body: form });

export const getCurrentUser = () =>
  apiRequest("/api/me/", { auth: true });

export function saveTokens({ access, refresh }) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access_token");
}

// --- Reports (Phase 3) ---

export function listReports(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  ).toString();
  return apiRequest(`/api/reports/${params ? `?${params}` : ""}`);
}

export function getReport(id) {
  return apiRequest(`/api/reports/${id}/`);
}

// Report submission needs multipart/form-data (because of the photo upload),
// so this bypasses apiRequest's JSON-only helper and builds FormData directly.
export async function createReport(form) {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("category", form.category);
  formData.append("description", form.description);
  formData.append("latitude", form.latitude);
  formData.append("longitude", form.longitude);
  formData.append("severity", form.severity);
  if (form.address) formData.append("address", form.address);
  if (form.photo) formData.append("photo", form.photo);

  const res = await fetch(`${API_URL}/api/reports/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type -- browser sets the multipart boundary
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Object.values(data).flat().join(" ") || "Failed to submit report";
    throw new Error(message);
  }
  return data;
}

export const upvoteReport = (id) =>
  apiRequest(`/api/reports/${id}/upvote/`, { method: "POST", auth: true });

export const CATEGORY_LABELS = {
  air: "Air Pollution",
  water: "Water Pollution",
  garbage: "Garbage / Waste",
  noise: "Noise Pollution",
  plastic: "Plastic Dumping",
  other: "Other",
};

export const STATUS_COLORS = {
  pending: "#d97706",
  in_progress: "#2563eb",
  resolved: "#16a34a",
  rejected: "#dc2626",
};

// --- Officer dashboard (Phase 4) ---

export const getDashboardStats = () =>
  apiRequest("/api/dashboard/stats/", { auth: true });

export const updateReportStatus = (id, newStatus, note) =>
  apiRequest(`/api/reports/${id}/status/`, {
    method: "PATCH",
    auth: true,
    body: { status: newStatus, note },
  });

// --- Officer provisioning (Phase 6, Super Admin only) ---

export const listOfficers = () =>
  apiRequest("/api/officers/", { auth: true });

export const createOfficer = (form) =>
  apiRequest("/api/officers/", { method: "POST", auth: true, body: form });

export const DESIGNATION_LABELS = {
  MDO: "Mandal Development Officer",
  MRO: "Mandal Revenue Officer",
  MUNICIPAL: "Municipal Officer",
  POLLUTION_BOARD: "Pollution Control Board Officer",
  OTHER: "Other Designated Authority",
};