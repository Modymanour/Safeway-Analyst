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

export function getIssueCategories(page = 1, pageNumber = 100) {
  const params = new URLSearchParams({ page: String(page), pageNumber: String(pageNumber) });
  return apiRequest(`/categories/get-all?${params}`);
}

export function getIssueReporters(page = 1, pageNumber = 100) {
  const params = new URLSearchParams({ page: String(page), pageNumber: String(pageNumber) });
  return apiRequest(`/dashboard/get-all-users?${params}`);
}

export function searchIssues(filters = {}) {
  return apiRequest("/issues/search", {
    method: "POST",
    body: {
      title: filters.title ?? null,
      description: filters.description ?? null,
      created_by: filters.created_by ?? null,
      category_id: filters.category_id ?? null,
      status: filters.status ?? null,
      priority: filters.priority ?? null,
      start_date: filters.start_date ?? null,
      end_date: filters.end_date ?? null,
      page: filters.page ?? 1,
      pageNumber: filters.pageNumber ?? 20,
    },
  });
}

export function createIssue(issue) {
  return apiRequest("/issues/create", { method: "POST", body: issue });
}

export function updateIssue(issueId, changes) {
  return apiRequest(`/issues/update/${encodeURIComponent(issueId)}`, {
    method: "PUT",
    body: {
      title: changes.title ?? null,
      description: changes.description ?? null,
      category_id: changes.category_id ?? null,
      status: changes.status ?? null,
      priority: changes.priority ?? null,
    },
  });
}

export function deleteIssue(issueId) {
  return apiRequest(`/issues/delete/${encodeURIComponent(issueId)}`, { method: "DELETE" });
}

export function searchIssueComments(issueId, page = 1, pageNumber = 100) {
  return apiRequest("/issue-comments/search", {
    method: "POST",
    body: {
      issue_id: issueId,
      author_id: null,
      body: null,
      edited: null,
      start_date: null,
      end_date: null,
      page,
      pageNumber,
    },
  });
}

export function createIssueComment(issueId, body) {
  return apiRequest("/issue-comments/create", { method: "POST", body: { issue_id: issueId, body } });
}

export function updateIssueComment(commentId, body) {
  return apiRequest(`/issue-comments/update/${encodeURIComponent(commentId)}`, {
    method: "PUT",
    body: { comment_id: commentId, body },
  });
}

export function deleteIssueComment(commentId) {
  return apiRequest(`/issue-comments/delete/${encodeURIComponent(commentId)}`, { method: "DELETE" });
}

export function createIssueCategory(category) {
  return apiRequest("/categories/create", { method: "POST", body: category });
}
