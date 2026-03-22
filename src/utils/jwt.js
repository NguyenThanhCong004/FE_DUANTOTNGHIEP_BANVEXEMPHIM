function decodeBase64Url(base64Url) {
  // base64Url: a.b.c => b is payload, base64Url uses '-' and '_'
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  return atob(padded);
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserIdFromToken(token) {
  const payload = decodeJwtPayload(token);
  return payload?.userId ?? null;
}

