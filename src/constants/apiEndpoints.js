/**
 * Đường dẫn API khớp BE (Swagger: http://localhost:8080/swagger-ui.html).
 * Prefix luôn là /api/v1 — ghép với getApiBaseUrl() / apiUrl().
 */
export const API_V1 = "/api/v1";

export const AUTH = {
  LOGIN: `${API_V1}/auth/login`,
  STAFF_LOGIN: `${API_V1}/auth/staff-login`,
  REGISTER: `${API_V1}/auth/register`,
  REFRESH: `${API_V1}/auth/refresh`,
  FORGOT_PASSWORD: `${API_V1}/auth/forgot-password`,
  FORGOT_PASSWORD_VERIFY_OTP: `${API_V1}/auth/forgot-password/verify-otp`,
  FORGOT_PASSWORD_RESEND_OTP: `${API_V1}/auth/forgot-password/resend-otp`,
  RESET_PASSWORD: `${API_V1}/auth/reset-password`,
};

export const USERS = {
  LIST: `${API_V1}/users`,
  BY_ID: (id) => `${API_V1}/users/${id}`,
  /** PUT body: { currentPassword, newPassword } */
  PASSWORD: (id) => `${API_V1}/users/${id}/password`,
};

export const STAFF = {
  LIST: `${API_V1}/staff`,
  ME: `${API_V1}/staff/me`,
  ME_PASSWORD: `${API_V1}/staff/me/password`,
  ME_PASSWORD_SEND_OTP: `${API_V1}/staff/me/password/send-otp`,
  SUPER_ADMIN_VIEW: `${API_V1}/staff/super-admin-view`,
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

export const ROOM_TYPES = {
  LIST: `${API_V1}/room-types`,
  BY_ID: (id) => `${API_V1}/room-types/${id}`,
};

/** Đóng phòng tạm thời (hỏng ghế/sự cố) + dời vé đã bán sang suất khác — status phòng: 0 Ngừng, 1 Hoạt động, 2 Đóng tạm thời. */
export const ROOM_CLOSURE = {
  CLOSE: (roomId) => `${API_V1}/rooms/${roomId}/close`,
  REOPEN: (roomId) => `${API_V1}/rooms/${roomId}/reopen`,
  AFFECTED_ORDERS: (roomId) => `${API_V1}/rooms/${roomId}/closure/affected-orders`,
  SUGGESTIONS: (roomId, orderId) => `${API_V1}/rooms/${roomId}/closure/orders/${orderId}/suggestions`,
  MOVE: (roomId, orderId) => `${API_V1}/rooms/${roomId}/closure/orders/${orderId}/move`,
  CANCEL: (roomId, orderId) => `${API_V1}/rooms/${roomId}/closure/orders/${orderId}/cancel`,
  AUTO_MOVE_TO_SPARE_TYPE: (roomId) => `${API_V1}/rooms/${roomId}/closure/auto-move-to-spare-type`,
};

export const MOVIES = {
  LIST: `${API_V1}/movies`,
  BY_ID: (id) => `${API_V1}/movies/${id}`,
  DELETE: (id) => `${API_V1}/movies/${id}`,
  REVIEWS: (id) => `${API_V1}/movies/${id}/reviews`,
  /** GET — danh sách URL ảnh banner (phim đang chiếu, ưu tiên doanh thu vé) */
  HOME_BANNERS: `${API_V1}/movies/home-banners`,
  /** POST — chuyển phim Sắp chiếu sang Đang chiếu nếu đến ngày */
  SYNC_STATUS: `${API_V1}/movies/sync-status`,
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
  /** GET — ca làm việc hiện tại của nhân viên */
  ACTIVE: `${API_V1}/shifts/active`,
};

export const PAYOS = {
  CREATE_LINK: `${API_V1}/payments/payos/create-link`,
  WEBHOOK: `${API_V1}/payments/payos/webhook`,
};

/** Đặt vé online — JWT khách (ROLE_USER), tạo đơn + link PayOS */
export const TICKET_ORDERS = {
  QUOTE: `${API_V1}/ticket-orders/quote`,
  CHECKOUT: `${API_V1}/ticket-orders/checkout`,
  CONFIRM_PAYOS: `${API_V1}/ticket-orders/confirm-payos`,
  CANCEL_PENDING: `${API_V1}/ticket-orders/cancel-pending`,
  QR: (qrToken) => `${API_V1}/ticket-orders/qr/${encodeURIComponent(qrToken || "")}`,
};

/** Đặt bắp nước riêng — JWT khách, PayOS */
export const FOOD_ORDERS = {
  CHECKOUT: `${API_V1}/food-orders/checkout`,
  CONFIRM_PAYOS: `${API_V1}/food-orders/confirm-payos`,
  CANCEL_PENDING: `${API_V1}/food-orders/cancel-pending`,
  RECEIPT_QR: (receiptToken) => `${API_V1}/food-orders/receipt-qr/${encodeURIComponent(receiptToken || "")}`,
};

/** Đặt vé & bắp nước tại quầy (POS) — JWT nhân viên (STAFF/ADMIN) */
export const COUNTER_ORDERS = {
  CHECKOUT: `${API_V1}/counter-orders/checkout`,
  CHECK_STATUS: (orderCode) => `${API_V1}/counter-orders/${orderCode}/status`,
  CONFIRM_PAID: (orderCode) => `${API_V1}/counter-orders/${orderCode}/confirm-paid`,
  CANCEL: (orderCode) => `${API_V1}/counter-orders/${orderCode}/cancel`,
  RECEIPT_BARCODE: (receiptToken) => `${API_V1}/counter-orders/receipt-barcode/${encodeURIComponent(receiptToken)}`,
  PAYMENT_QR: (qrCode) => `${API_V1}/counter-orders/payment-qr?data=${encodeURIComponent(qrCode || "")}`,
};

export const VOUCHERS = {
  LIST: `${API_V1}/vouchers`,
  BY_ID: (id) => `${API_V1}/vouchers/${id}`,
};

export const NEWS = {
  LIST: `${API_V1}/news`,
  BY_ID: (id) => `${API_V1}/news/${id}`,
  DELETE: (id) => `${API_V1}/news/${id}`,
};

export const MEMBERSHIP_RANKS = {
  LIST: `${API_V1}/membership-ranks`,
  BY_ID: (id) => `${API_V1}/membership-ranks/${id}`,
  DELETE: (id) => `${API_V1}/membership-ranks/${id}`,
};

export const PRODUCT_CATEGORIES = {
  LIST: `${API_V1}/product-categories`,
  BY_ID: (id) => `${API_V1}/product-categories/${id}`,
};

export const PRODUCTS = {
  LIST: `${API_V1}/products`,
  BY_ID: (id) => `${API_V1}/products/${id}`,
};

export const SUPER_ADMIN_DASHBOARD = {
  SUMMARY: `${API_V1}/super-admin/dashboard/summary`,
  REVENUE_CHART: (year, granularity, range) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (granularity) q.set("granularity", granularity);
    if (range?.from) q.set("from", range.from);
    if (range?.to) q.set("to", range.to);
    const qs = q.toString();
    return `${API_V1}/super-admin/dashboard/revenue-chart${qs ? `?${qs}` : ""}`;
  },
  CINEMA_RANKING: (year, month) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (month) q.set("month", String(month));
    const qs = q.toString();
    return `${API_V1}/super-admin/dashboard/cinema-ranking${qs ? `?${qs}` : ""}`;
  },
  CINEMA_DETAIL: (id) => `${API_V1}/super-admin/dashboard/cinema-detail/${id}`,
  TOP_MOVIES: (limit) => `${API_V1}/super-admin/dashboard/top-movies${limit ? `?limit=${limit}` : ""}`,
  SEAT_OCCUPANCY: `${API_V1}/super-admin/dashboard/seat-occupancy`,
  PAYMENT_METHOD_REVENUE: `${API_V1}/super-admin/dashboard/payment-method-revenue`,
  RECENT_ADMIN_ACTIVITY: (limit) => `${API_V1}/super-admin/dashboard/recent-admin-activity${limit ? `?limit=${limit}` : ""}`,
  AUDIT_LOG: (limit) => `${API_V1}/super-admin/dashboard/audit-log${limit ? `?limit=${limit}` : ""}`,
  MOVIE_STATS: `${API_V1}/super-admin/dashboard/movie-stats`,
  MOVIE_CINEMA_REVENUE: (movieId) => `${API_V1}/super-admin/dashboard/movie-cinema-revenue?movieId=${movieId}`,
  CINEMA_MOVIE_REVENUE: (cinemaId) => `${API_V1}/super-admin/dashboard/cinema-movie-revenue?cinemaId=${cinemaId}`,
  CINEMA_STATS: `${API_V1}/super-admin/dashboard/cinema-stats`,
  CUSTOMER_STATS: (cinemaId) =>
    `${API_V1}/super-admin/dashboard/customer-stats${cinemaId ? `?cinemaId=${cinemaId}` : ""}`,
  CUSTOMER_STATS_BY_CINEMA: `${API_V1}/super-admin/dashboard/customer-stats/by-cinema`,
  INVOICE_STATS: `${API_V1}/super-admin/dashboard/invoice-stats`,
  PRODUCT_STATS: `${API_V1}/super-admin/dashboard/product-stats`,
  PRODUCT_CATEGORY_REVENUE: (year, month) => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (month !== undefined && month !== null) q.set("month", String(month));
    const qs = q.toString();
    return `${API_V1}/super-admin/dashboard/product-stats/category-revenue${qs ? `?${qs}` : ""}`;
  },
};

export const ADMIN_DASHBOARD = {
  SUMMARY: (cinemaId) => `${API_V1}/admin/dashboard/summary${cinemaId ? `?cinemaId=${cinemaId}` : ""}`,
  REVENUE_BY_DAY: (cinemaId, days) => {
    const q = new URLSearchParams();
    if (cinemaId) q.set("cinemaId", String(cinemaId));
    if (days) q.set("days", String(days));
    const qs = q.toString();
    return `${API_V1}/admin/dashboard/revenue-by-day${qs ? `?${qs}` : ""}`;
  },
  TICKETS_BY_HOUR: (cinemaId, date) => {
    const q = new URLSearchParams();
    if (cinemaId) q.set("cinemaId", String(cinemaId));
    if (date) q.set("date", date);
    const qs = q.toString();
    return `${API_V1}/admin/dashboard/tickets-by-hour${qs ? `?${qs}` : ""}`;
  },
  TOP_MOVIES: (cinemaId, limit) => {
    const q = new URLSearchParams();
    if (cinemaId) q.set("cinemaId", String(cinemaId));
    if (limit) q.set("limit", String(limit));
    const qs = q.toString();
    return `${API_V1}/admin/dashboard/top-movies${qs ? `?${qs}` : ""}`;
  },
  SEAT_TYPE_RATIO: (cinemaId) => `${API_V1}/admin/dashboard/seat-type-ratio${cinemaId ? `?cinemaId=${cinemaId}` : ""}`,
  NOTIFICATIONS: (cinemaId, limit) => {
    const q = new URLSearchParams();
    if (cinemaId) q.set("cinemaId", String(cinemaId));
    if (limit) q.set("limit", String(limit));
    const qs = q.toString();
    return `${API_V1}/admin/dashboard/notifications${qs ? `?${qs}` : ""}`;
  },
};

export const NOTIFICATIONS = {
  LIST: (cinemaId, limit) => {
    const q = new URLSearchParams();
    if (cinemaId) q.set("cinemaId", String(cinemaId));
    if (limit) q.set("limit", String(limit));
    const qs = q.toString();
    return `${API_V1}/notifications${qs ? `?${qs}` : ""}`;
  },
  CREATE: `${API_V1}/notifications`,
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
  REVIEW_BY_MOVIE: (movieId) => `${API_V1}/me/movie-reviews/${movieId}`,
  VOUCHERS: `${API_V1}/me/vouchers`,
  REDEEM_VOUCHER: `${API_V1}/me/vouchers/redeem`,
  POINTS_HISTORY: `${API_V1}/me/points-history`,
};

export const STAFF_DASHBOARD = {
  STATS: `${API_V1}/staff/dashboard-stats`,
  RECENT_ORDERS: `${API_V1}/staff/dashboard-stats/recent-orders`,
  ORDER_DETAIL: (orderCode) => `${API_V1}/staff/dashboard-stats/orders/${orderCode}`,
  PRODUCTS_BREAKDOWN: `${API_V1}/staff/dashboard-stats/products-breakdown`,
  REVENUE_BREAKDOWN: `${API_V1}/staff/dashboard-stats/revenue-breakdown`,
  CUSTOMER_BY_PHONE: (phone) => `${API_V1}/staff/dashboard-stats/customer-by-phone?phone=${encodeURIComponent(phone)}`,
  CREATE_GUEST: (phone) => `${API_V1}/staff/dashboard-stats/create-guest?phone=${encodeURIComponent(phone)}`,
};
