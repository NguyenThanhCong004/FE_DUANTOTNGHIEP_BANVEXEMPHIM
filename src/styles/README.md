# Giao diện FE — chuẩn thống nhất

## Thứ tự import (`main.jsx`)

1. `design-tokens.css` — font + biến `--font-ui`, `--font-content`, `--font-brand`, `--admin-*`
2. `auth-public.css` — đồng bộ font/class cho đăng nhập, đăng ký, quên MK, nhân viên
3. `bootstrap.min.css`
4. `index.css` — reset, modal admin
5. `site-chrome.css` — Navbar + Footer (không còn `<style>` inline trong component)
6. `public-theme.css` — `html.cinetoon-public` (gradient, card, form trong `main`)

**Admin / Super Admin:** `admin-shell.css` được import trong `AdminLayout.jsx` và `SuperAdminLayout.jsx` (sidebar, header, khóa menu theo rạp).

## Font

| Biến | Dùng cho |
|------|----------|
| `--font-ui` (Inter + Roboto/Open Sans/Lato/Arial/Tahoma fallback) | Toàn site: header, footer, admin/superadmin, nút, form |
| `--font-content` | Cùng stack với `--font-ui` (đọc màn hình tốt) |
| `--font-brand` (Bebas Neue) | Logo CINETOON |

## Vùng ứng dụng

- `html.cinetoon-public` — RouteThemeSync: trang user/common (Layout)
- `html.admin-panel` — `/admin`, `/super-admin`
