/**
 * Đường dẫn API khớp BE (Swagger: http://localhost:8080/swagger-ui.html).
 * Prefix luôn là /api/v1 — ghép với getApiBaseUrl() / apiUrl().
 */
export const API_V1 = "/api/v1";

export const AUTH = {
  LOGIN: `${API_V1}/auth/login`,
  REGISTER: `${API_V1}/auth/register`,
  REFRESH: `${API_V1}/auth/refresh`,
};

export const USERS = {
  LIST: `${API_V1}/users`,
  BY_ID: (id) => `${API_V1}/users/${id}`,
  /** PUT body: { currentPassword, newPassword } */
  PASSWORD: (id) => `${API_V1}/users/${id}/password`,
};

export const STAFF = {
  LIST: `${API_V1}/staff`,
  BY_ID: (id) => `${API_V1}/staff/${id}`,
  /** PUT body: { currentPassword, newPassword } — chỉ đổi mật khẩu của chính mình */
  PASSWORD: (id) => `${API_V1}/staff/${id}/password`,
};

export const CINEMAS = {
  LIST: `${API_V1}/cinemas`,
  BY_ID: (id) => `${API_V1}/cinemas/${id}`,
  /** GET — chia onSale / notOnSale theo bảng cinema_products */
  PRODUCT_MENU: (cinemaId) => `${API_V1}/cinemas/${cinemaId}/product-menu`,
  /** PUT body: { selling: boolean } */
  PRODUCT_MENU_SELLING: (cinemaId, productId) =>
    `${API_V1}/cinemas/${cinemaId}/product-menu/products/${productId}/selling`,
};

export const GENRES = {
  LIST: `${API_V1}/genres`,
  BY_ID: (id) => `${API_V1}/genres/${id}`,
  DELETE: (id) => `${API_V1}/genres/${id}`,
};

export const ROOMS = {
  LIST: `${API_V1}/rooms`,
  BY_ID: (id) => `${API_V1}/rooms/${id}`,
};

export const MOVIES = {
  LIST: `${API_V1}/movies`,
  BY_ID: (id) => `${API_V1}/movies/${id}`,
  /** GET — danh sách URL ảnh banner (phim đang chiếu, ưu tiên doanh thu vé) */
  HOME_BANNERS: `${API_V1}/movies/home-banners`,
};

export const SHOWTIMES = {
  LIST: `${API_V1}/showtimes`,
  BY_ID: (id) => `${API_V1}/showtimes/${id}`,
};

/** Giữ ghế tạm (không JWT) — holderId do FE tạo */
export const SHOWTIME_SEAT_HOLDS = {
  REFRESH: `${API_V1}/showtime-seat-holds/refresh`,
  PEER: (showtimeId, excludeHolder) => {
    const q = new URLSearchParams({ showtimeId: String(showtimeId) });
    if (excludeHolder) q.set("excludeHolder", excludeHolder);
    return `${API_V1}/showtime-seat-holds/peer?${q.toString()}`;
  },
};

export const PROMOTIONS = {
  LIST: `${API_V1}/promotions`,
  BY_ID: (id) => `${API_V1}/promotions/${id}`,
};

/** Ghế & loại ghế */
export const SEAT_TYPES = {
  LIST: `${API_V1}/seat-types`,
  BY_ID: (id) => `${API_V1}/seat-types/${id}`,
};
/** @deprecated dùng SEAT_TYPES.LIST */
export const SEAT_TYPES_LEGACY = `${API_V1}/seat-types`;
export const SEATS = {
  BY_ROOM: (roomId) => `${API_V1}/seats?roomId=${roomId}`,
  LAYOUT: `${API_V1}/seats`,
};

export const SHIFTS = {
  LIST: `${API_V1}/shifts`,
  BY_ID: (id) => `${API_V1}/shifts/${id}`,
  /** GET — JWT bắt buộc; chỉ nhân viên (staff), trả ca của chính mình */
  ME: `${API_V1}/shifts/me`,
};

export const PAYOS = {
  CREATE_LINK: `${API_V1}/payments/payos/create-link`,
  WEBHOOK: `${API_V1}/payments/payos/webhook`,
};

/** Đặt vé online — JWT khách (ROLE_USER), tạo đơn + link PayOS */
export const TICKET_ORDERS = {
  CHECKOUT: `${API_V1}/ticket-orders/checkout`,
  CANCEL_PENDING: `${API_V1}/ticket-orders/cancel-pending`,
};

/** Đặt bắp nước riêng — JWT khách, PayOS */
export const FOOD_ORDERS = {
  CHECKOUT: `${API_V1}/food-orders/checkout`,
  CANCEL_PENDING: `${API_V1}/food-orders/cancel-pending`,
};

export const VOUCHERS = {
  LIST: `${API_V1}/vouchers`,
  BY_ID: (id) => `${API_V1}/vouchers/${id}`,
};

export const NEWS = {
  LIST: `${API_V1}/news`,
  BY_ID: (id) => `${API_V1}/news/${id}`,
};

export const MEMBERSHIP_RANKS = {
  LIST: `${API_V1}/membership-ranks`,
  BY_ID: (id) => `${API_V1}/membership-ranks/${id}`,
};

export const PRODUCT_CATEGORIES = {
  LIST: `${API_V1}/product-categories`,
  BY_ID: (id) => `${API_V1}/product-categories/${id}`,
};

export const PRODUCTS = {
  LIST: `${API_V1}/products`,
  BY_ID: (id) => `${API_V1}/products/${id}`,
};

export const ORDERS_ONLINE = {
  LIST: `${API_V1}/orders-online`,
  BY_ID: (id) => `${API_V1}/orders-online/${id}`,
};

/** JWT khách — lịch sử, yêu thích, voucher ví, điểm */
export const ME = {
  TRANSACTIONS: `${API_V1}/me/transactions`,
  FAVORITES: `${API_V1}/me/favorites`,
  FAVORITE_BY_MOVIE: (movieId) => `${API_V1}/me/favorites/${movieId}`,
  VOUCHERS: `${API_V1}/me/vouchers`,
  REDEEM_VOUCHER: `${API_V1}/me/vouchers/redeem`,
  POINTS_HISTORY: `${API_V1}/me/points-history`,
};
