const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || `API request failed (${response.status})`);
  }
  if (!payload || payload.status_code >= 400 || !payload.data) {
    throw new Error(payload?.msg || "The API returned an unexpected response.");
  }
  return payload.data;
}

export function getDashboardRange(start, end) {
  const [start_year, start_month] = start.split("-").map(Number);
  const [end_year, end_month] = end.split("-").map(Number);
  const params = new URLSearchParams({ start_year, start_month, end_year, end_month });
  return request(`/dashboard/get-custom-month-range-data?${params}`);
}

export function getDashboardSpecificMonths(months) {
  const params = new URLSearchParams({ months: JSON.stringify(months) });
  return request(`/dashboard/get-specific-months-data?${params}`);
}
