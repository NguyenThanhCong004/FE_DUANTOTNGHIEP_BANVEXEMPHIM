/** Map BE MeTransactionDto (camelCase) → shape TransactionHistory.jsx dùng (snake_case). */
export function mapMeTransactionToFe(row) {
  const items = (row.items || []).map((i) => ({
    label: i.label,
    sub: i.sub || "",
    price: Number(i.price ?? 0),
    qty: Number(i.qty ?? 1),
    icon: i.icon || "🎫",
  }));
  const createdAt = row.createdAt;
  let created = createdAt;
  if (Array.isArray(createdAt) && createdAt.length >= 3) {
    const [y, m, d, hh = 0, mm = 0, ss = 0] = createdAt;
    created = new Date(y, m - 1, d, hh, mm, ss).toISOString();
  } else if (typeof createdAt === "string") {
    created = createdAt;
  }
  return {
    id: String(row.id),
    order_code: row.orderCode ?? "",
    type: row.type,
    status: row.status,
    items: items.length ? items : [{ label: "—", sub: "", price: 0, qty: 1, icon: "🧾" }],
    original_amount: Number(row.originalAmount ?? 0),
    discount_amount: Number(row.discountAmount ?? 0),
    final_amount: Number(row.finalAmount ?? 0),
    created_at: created,
    points_earned: Number(row.pointsEarned ?? 0),
    voucher_code: row.voucherCode ?? null,
  };
}

export function mapFavoriteRowToFavCard(row) {
  const mid = row.movieId;
  return {
    favorite_id: row.favoriteId,
    review: null,
    movie: {
      id: mid,
      posterUrl: row.poster || "",
      title: row.title || "—",
      genre: "",
      ageLimit: null,
      type: row.status === 2 ? "soon" : "now",
    },
  };
}

export function mapUserVoucherRow(uv) {
  const v = uv.voucher;
  return {
    userVoucherId: uv.userVoucherId,
    status: uv.status,
    voucher: v
      ? {
          id: v.id,
          code: v.code,
          Code: v.code,
          discountType: v.discountType,
          discount_type: (v.discountType || "").toLowerCase(),
          value: v.value,
          minOrderValue: v.minOrderValue,
          startDate: v.startDate,
          endDate: v.endDate,
          pointVoucher: v.pointVoucher,
          status: v.status,
        }
      : null,
  };
}
