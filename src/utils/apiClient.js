/**
 * Gọi API BE thống nhất — gắn Bearer token khi có.
 * BE: ApiResponse { status, message, data }
 */
import { getAccessToken } from "./authStorage";

const DEFAULT_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function getApiBaseUrl() {
  return String(DEFAULT_BASE).replace(/\/$/, "");
}

/** Base URL + path (luôn bắt đầu bằng /) — dùng thống nhất thay vì lặp VITE_API_BASE_URL. */
export function apiUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * @param {string} path - ví dụ "/api/v1/users" (có hoặc không có base)
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, { ...init, headers });
}

/**
 * @returns {Promise<{ ok: boolean, status: number, data: any, message?: string }>}
 */
export async function apiJson(path, init = {}) {
  const res = await apiFetch(path, init);
  const json = await res.json().catch(() => null);
  const data = json?.data !== undefined ? json.data : json;
  return {
    ok: res.ok,
    status: res.status,
    data,
    message: json?.message,
    raw: json,
  };
}
