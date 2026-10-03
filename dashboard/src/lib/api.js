import { apiRequest } from "@/lib/auth";

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
