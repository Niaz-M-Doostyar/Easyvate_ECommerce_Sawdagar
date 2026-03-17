"use client";
import useSWR from "swr";

const API_BASE = "/api/admin";

const fetcher = (url) => fetch(url, { credentials: "include" }).then((r) => {
  if (!r.ok) throw new Error("Fetch failed");
  return r.json();
});

export function useAdminStats() {
  return useSWR(`${API_BASE}/stats`, fetcher, { refreshInterval: 60000 });
}

export function useAdminChartData(days = 30) {
  const { data, error, isLoading, mutate } = useSWR(`${API_BASE}/chart-data?days=${days}`, fetcher, { refreshInterval: 120000 });
  return { data: data?.chartData, error, isLoading, mutate };
}

export function useAdminProducts(page = 1, limit = 20, status = "all", search = "") {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  return useSWR(`${API_BASE}/products?${params}`, fetcher);
}

export function useAdminProduct(id) {
  return useSWR(id ? `${API_BASE}/products/${id}` : null, fetcher);
}

export function useAdminUsers(page = 1, limit = 20, role = "", search = "") {
  const params = new URLSearchParams({ page, limit });
  if (role && role !== "all") params.set("role", role);
  if (search) params.set("search", search);
  return useSWR(`${API_BASE}/users?${params}`, fetcher);
}

export function useAdminUser(id) {
  return useSWR(id ? `${API_BASE}/users/${id}` : null, fetcher);
}

export function useAdminOrders(page = 1, limit = 20, status = "") {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== "all") params.set("status", status);
  return useSWR(`${API_BASE}/orders?${params}`, fetcher);
}

export function useAdminOrder(id) {
  return useSWR(id ? `${API_BASE}/orders/${id}` : null, fetcher);
}

export function useDeliveryPersons() {
  // The backend responds with { deliveryPersons: [...] }
  // normalize so consumers receive the array directly
  const { data, error, ...rest } = useSWR(`${API_BASE}/delivery-persons`, fetcher);
  return { data: data?.deliveryPersons || [], error, ...rest };
}

export function useAdminReportSummary(period = "month") {
  return useSWR(`${API_BASE}/reports/summary?period=${period}`, fetcher, { refreshInterval: 120000 });
}

export function useAdminCategories() {
  return useSWR("/api/categories", fetcher);
}

export function useContactMessages(page = 1, limit = 15) {
  return useSWR(`${API_BASE}/contact-messages?page=${page}&limit=${limit}`, fetcher);
}

export function useSiteContent() {
  return useSWR(`${API_BASE}/site-content`, fetcher);
}

// Mutation helpers
export async function adminFetch(url, options = {}) {
  const res = await fetch(url.startsWith("/") ? url : `${API_BASE}/${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function adminPost(path, body) {
  return adminFetch(`${API_BASE}/${path}`, { method: "POST", body: JSON.stringify(body) });
}

export async function adminPut(path, body) {
  return adminFetch(`${API_BASE}/${path}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function adminDelete(path) {
  return adminFetch(`${API_BASE}/${path}`, { method: "DELETE" });
}

export async function adminPatch(path, body) {
  return adminFetch(`${API_BASE}/${path}`, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
}
