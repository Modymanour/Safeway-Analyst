const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const REFRESH_TOKEN_KEY = "safeway.refreshToken";

let accessToken = null;
let refreshInFlight = null;

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  accessToken = null;
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function setTokens(tokens) {
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new Error("The API did not return a complete token pair.");
  }
  accessToken = tokens.access_token;
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function getCurrentUser() {
  if (!accessToken) return null;
  try {
    const encoded = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(window.atob(encoded));
    if (claims.exp && claims.exp * 1000 <= Date.now()) return null;
    return {
      id: claims.sub,
      username: claims.username,
      email: claims.email,
      role: claims.role,
    };
  } catch {
    return null;
  }
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || (payload?.status_code != null && payload.status_code >= 400) || payload?.status === "Failed") {
    throw new Error(payload?.msg || payload?.message || `API request failed (${response.status})`);
  }
  if (!payload || !Object.hasOwn(payload, "data")) {
    throw new Error("The API returned an unexpected response.");
  }
  return payload.data;
}

async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Your session has expired. Please sign in again.");
  const response = await fetch(`${API_BASE_URL}/dashboard/sign-in-with-refresh-token`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const tokens = await parseResponse(response);
  setTokens(tokens);
  return getCurrentUser();
}

export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens()
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function send(path, options = {}) {
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken && !options.skipAuth) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

export async function apiRequest(path, options = {}) {
  let response = await send(path, options);
  if ([401, 403].includes(response.status) && !options.skipRefresh && getRefreshToken()) {
    try {
      await refreshSession();
      response = await send(path, options);
    } catch (error) {
      window.dispatchEvent(new Event("safeway:session-expired"));
      throw error;
    }
  }
  return parseResponse(response);
}

export async function signIn(email, password) {
  const tokens = await apiRequest("/dashboard/sign-in", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
    skipRefresh: true,
  });
  setTokens(tokens);
  return getCurrentUser();
}

export function requestVerificationCode(email) {
  return apiRequest("/dashboard/verification-token", {
    method: "POST",
    body: { email },
    skipAuth: true,
    skipRefresh: true,
  });
}

export function confirmVerificationCode(email, otp) {
  return apiRequest("/dashboard/verification-token/confirm", {
    method: "POST",
    body: { email, otp },
    skipAuth: true,
    skipRefresh: true,
  });
}

export function requestPasswordResetCode(email) {
  return apiRequest("/dashboard/password-reset-token", {
    method: "POST",
    body: { email },
    skipAuth: true,
    skipRefresh: true,
  });
}

export function confirmPasswordReset(email, otp, newPassword) {
  return apiRequest("/dashboard/password-reset-token/confirm", {
    method: "POST",
    body: { email, otp, new_password: newPassword },
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function signOut(userId) {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiRequest("/dashboard/sign-out", {
        method: "POST",
        body: { user_id: userId, refresh_token: refreshToken },
      });
    }
  } finally {
    clearSession();
  }
}

export function getDashboardRange(start, end) {
  const [start_year, start_month] = start.split("-").map(Number);
  const [end_year, end_month] = end.split("-").map(Number);
  const params = new URLSearchParams({ start_year, start_month, end_year, end_month });
  return apiRequest(`/dashboard/get-custom-month-range-data?${params}`);
}

export function getDashboardSpecificMonths(months) {
  const params = new URLSearchParams({ months: JSON.stringify(months) });
  return apiRequest(`/dashboard/get-specific-months-data?${params}`);
}

export function getDashboardUsers(page = 1, pageSize = 10) {
  const params = new URLSearchParams({ page: String(page), pageNumber: String(pageSize) });
  return apiRequest(`/dashboard/get-all-users?${params}`);
}

export function createDashboardUser(user, role) {
  const endpoint = role === "admin" ? "create-admin" : "create-user";
  return apiRequest(`/dashboard/${endpoint}`, { method: "POST", body: user });
}

export async function changeDashboardUserRole(userId, role, updateSession = false) {
  const params = new URLSearchParams({ user_id: userId, role });
  const tokens = await apiRequest(`/dashboard/change-role?${params}`, { method: "PUT" });
  if (updateSession) {
    setTokens(tokens);
    return getCurrentUser();
  }
  return null;
}

export function deleteDashboardUser(userId) {
  const params = userId ? `?${new URLSearchParams({ user_id: userId })}` : "";
  return apiRequest(`/dashboard/delete-user${params}`);
}
