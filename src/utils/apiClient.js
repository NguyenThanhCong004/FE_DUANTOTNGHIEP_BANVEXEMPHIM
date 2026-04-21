/**
 * Gọi API BE thống nhất — gắn Bearer token khi có.
 * BE: ApiResponse { status, message, data }
 */
import { getAccessToken, getRefreshToken, setAuthSession, clearAuthSession } from "./authStorage";
import { AUTH } from "../constants/apiEndpoints";

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

// Flag để tránh loop infinite khi refresh
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Thêm callback vào queue khi đang refresh
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

/**
 * Thực hiện tất cả callback trong queue sau khi refresh xong
 */
function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

/**
 * Gọi API refresh token
 */
async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Không có refresh token");
  }

  const res = await fetch(apiUrl(AUTH.REFRESH), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: refreshToken,
      accessToken: getAccessToken()
    })
  });

  if (!res.ok) {
    throw new Error("Refresh token không hợp lệ");
  }

  const json = await res.json();
  const { token, refreshToken: newRefreshToken, user, staff } = json.data;
  
  // Lưu token mới
  setAuthSession({ 
    accessToken: token, 
    refreshToken: newRefreshToken, 
    user, 
    staff 
  });
  
  return token;
}

/**
 * @returns {Promise<{ ok: boolean, status: number, data: any, message?: string }>}
 */
export async function apiJson(path, init = {}) {
  try {
    let res = await apiFetch(path, init);
    const text = await res.text(); // Đọc dạng text trước để tránh lỗi JSON.parse
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("Lỗi parse JSON tại path:", path, "Nội dung nhận được:", text);
    }

    const data = json?.data !== undefined ? json.data : json;
    
    // Nếu access token hết hạn (401), thử refresh
    if (res.status === 401 && getRefreshToken()) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshTokens();
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          // Gọi lại API gốc với token mới
          res = await apiFetch(path, init);
          const newText = await res.text();
          try {
            json = newText ? JSON.parse(newText) : null;
          } catch (e) {
            console.error("Lỗi parse JSON sau refresh:", path, newText);
          }
        } catch (refreshError) {
          isRefreshing = false;
          clearAuthSession();
          // Redirect về trang đăng nhập
          window.location.href = "/login";
          return {
            ok: false,
            status: 401,
            data: null,
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            raw: json,
          };
        }
      } else {
        // Đang refresh, đợi xong rồi gọi lại
        await new Promise(resolve => {
          subscribeTokenRefresh(resolve);
        });
        res = await apiFetch(path, init);
        const newText = await res.text();
        try {
          json = newText ? JSON.parse(newText) : null;
        } catch (e) {
          console.error("Lỗi parse JSON sau refresh queue:", path, newText);
        }
      }
    }
    
    if (!res.ok) {
        console.warn(`API Error [${res.status}] at ${path}:`, json?.message || "Unknown error");
    }

    const newData = json?.data !== undefined ? json.data : json;
    return {
      ok: res.ok,
      status: res.status,
      data: newData,
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
