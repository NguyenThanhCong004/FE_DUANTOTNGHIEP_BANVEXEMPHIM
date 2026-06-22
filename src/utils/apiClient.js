/**
 * Gọi API BE thống nhất — gắn Bearer token khi có.
 * BE: ApiResponse { status, message, data }
 */
import { getAccessToken, getRefreshToken, getStoredStaff, setAuthSession, clearAuthSession } from "./authStorage";
import { AUTH } from "../constants/apiEndpoints";
import { isJwtExpired } from "./jwt";
import { MESSAGES } from "./uiMessages";

const envApiBase = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_BASE = envApiBase === undefined ? "http://localhost:18080" : envApiBase;
const FETCH_INTERCEPTOR_FLAG = "__cinemaxApiFetchInterceptorInstalled";

export function getApiBaseUrl() {
  return String(DEFAULT_BASE).replace(/\/$/, "");
}

/** Base URL + path (luôn bắt đầu bằng /) — dùng thống nhất thay vì lặp VITE_API_BASE_URL. */
export function apiUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function withQuery(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (text) search.set(key, text);
  });
  const qs = search.toString();
  if (!qs) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
}

function buildApiUrl(path) {
  const base = getApiBaseUrl();
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function isInternalApiUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const apiBase = new URL(getApiBaseUrl(), window.location.origin);
    return parsed.origin === apiBase.origin && parsed.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function isAuthUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith("/api/v1/auth/");
  } catch {
    return false;
  }
}

async function redirectIfLockedAccount(res) {
  if (typeof window === "undefined" || res?.status !== 403) return false;

  let message = "";
  try {
    const json = await res.clone().json();
    message = String(json?.message || "");
  } catch {
    message = "";
  }

  const normalized = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized.includes("tai khoan") || !normalized.includes("khoa")) {
    return false;
  }

  const wasStaffSession = Boolean(getStoredStaff());
  clearAuthSession();
  window.sessionStorage?.setItem(
    "authErrorMessage",
    message || "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
  );

  const loginPath = wasStaffSession ? "/staff/login" : "/login";
  if (window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
  return true;
}

function getFetchInputUrl(input) {
  if (typeof input === "string" || input instanceof URL) return String(input);
  return input?.url || "";
}

function mergeFetchHeaders(input, init, token) {
  const requestHeaders = input instanceof Request ? input.headers : undefined;
  const headers = new Headers(init?.headers || requestHeaders || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

function buildRequestHeaders(init, token) {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function refreshTokenOnce() {
  if (!isRefreshing) {
    isRefreshing = true;
    try {
      const newToken = await refreshTokens();
      onTokenRefreshed(newToken);
      return newToken;
    } catch (err) {
      onTokenRefreshed(null);
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  return new Promise((resolve, reject) => {
    subscribeTokenRefresh((newToken) => {
      if (newToken) resolve(newToken);
      else reject(new Error("Refresh token không hợp lệ"));
    });
  });
}

async function getFreshAccessToken() {
  const token = getAccessToken();
  if (!token) return null;
  if (!isJwtExpired(token, 30000)) return token;
  if (!getRefreshToken()) return token;

  try {
    return await refreshTokenOnce();
  } catch {
    clearAuthSession();
    return null;
  }
}

export function installApiFetchInterceptor() {
  if (typeof window === "undefined" || window[FETCH_INTERCEPTOR_FLAG]) return;

  const nativeFetch = window.fetch.bind(window);
  window[FETCH_INTERCEPTOR_FLAG] = true;

  window.fetch = async (input, init = {}) => {
    const url = getFetchInputUrl(input);
    if (!isInternalApiUrl(url) || isAuthUrl(url)) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : {}));
    const hasExplicitAuth = headers.has("Authorization");
    let token = null;

    if (!hasExplicitAuth) {
      token = await getFreshAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    let res = await nativeFetch(input, { ...init, headers });
    await redirectIfLockedAccount(res);

    if (res.status === 401 && getRefreshToken()) {
      try {
        token = await refreshTokenOnce();
        res = await nativeFetch(input, {
          ...init,
          headers: mergeFetchHeaders(input, init, token),
        });
        await redirectIfLockedAccount(res);
      } catch {
        const wasStaffSession = Boolean(getStoredStaff());
        clearAuthSession();
        if (window.location.pathname !== "/login" && window.location.pathname !== "/staff/login") {
          window.location.href = wasStaffSession ? "/staff/login" : "/login";
        }
      }
    }

    return res;
  };
}

/**
 * @param {string} path - ví dụ "/api/v1/users" (có hoặc không có base)
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const url = buildApiUrl(path);
  const hasExplicitAuth = new Headers(init.headers || {}).has("Authorization");
  const requestWithToken = (token) => fetch(url, { ...init, headers: buildRequestHeaders(init, token) });

  let token = hasExplicitAuth ? null : await getFreshAccessToken();
  let res = await requestWithToken(token);
  await redirectIfLockedAccount(res);

  if (res.status === 401 && !hasExplicitAuth && getRefreshToken()) {
    try {
      token = await refreshTokenOnce();
      res = await requestWithToken(token);
      await redirectIfLockedAccount(res);
    } catch {
      clearAuthSession();
    }
  }

  return res;
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
  if (!json?.data) {
    throw new Error("Phản hồi refresh token không hợp lệ");
  }
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
    } catch {
      console.error("Lỗi parse JSON tại path:", path, "Nội dung nhận được:", text);
    }

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
          } catch {
            console.error("Lỗi parse JSON sau refresh:", path, newText);
          }
        } catch {
          isRefreshing = false;
          const wasStaffSession = Boolean(getStoredStaff());
          clearAuthSession();
          // Redirect về trang đăng nhập
          window.location.href = wasStaffSession ? "/staff/login" : "/login";
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
        } catch {
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
      message: MESSAGES.networkError,
    };
  }
}
