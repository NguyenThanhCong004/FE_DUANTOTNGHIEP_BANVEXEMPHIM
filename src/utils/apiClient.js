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
  try {
    const res = await apiFetch(path, init);
    const text = await res.text(); // Đọc dạng text trước để tránh lỗi JSON.parse
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("Lỗi parse JSON tại path:", path, "Nội dung nhận được:", text);
    }

    const data = json?.data !== undefined ? json.data : json;
    
    if (!res.ok) {
        console.warn(`API Error [${res.status}] at ${path}:`, json?.message || "Unknown error");
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      message: json?.message || (res.ok ? "" : "Lỗi hệ thống (BE)"),
      raw: json,
    };
  } catch (err) {
    console.error("Network Error hoặc BE không phản hồi:", err);
    return {
      ok: false,
      status: 0,
      data: null,
      message: "Không thể kết nối đến server (Backend). Hãy kiểm tra BE đã chạy chưa?",
    };
  }
}
