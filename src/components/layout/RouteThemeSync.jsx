import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Gắn class lên <html> để tách theme trang user (MovieZone) khỏi admin/super-admin,
 * tránh CSS global trong index.html đè Bootstrap / text-dark / form.
 */
export default function RouteThemeSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isAdminPanel =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/super-admin");

    document.documentElement.classList.toggle("admin-panel", isAdminPanel);
    document.documentElement.classList.toggle("moviezone-public", !isAdminPanel);
  }, [pathname]);

  return null;
}
