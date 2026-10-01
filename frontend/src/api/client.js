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