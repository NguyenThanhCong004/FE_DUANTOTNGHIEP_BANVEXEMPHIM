/**
 * Khớp BE SeatLayoutRules: không chừa đúng 1 ghế trống kẹp giữa hai ghế đã chiếm trên cùng hàng.
 * @param {Array<{ seatId: any, row?: string, number?: string|number, x?: number }>} allSeats
 * @param {Set<number>|number[]} blockedSeatIds — đã bán ∪ peer đang chọn ∪ ghế mình đang chọn
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function checkNoSingleSeatOrphanInRows(allSeats, blockedSeatIds) {
  const blocked = blockedSeatIds instanceof Set ? blockedSeatIds : new Set(blockedSeatIds);
  if (!allSeats?.length) return { ok: true };

  const byRow = new Map();
  for (const s of allSeats) {
    if (s.seatId == null) continue;
    const row = s.row != null ? String(s.row) : "?";
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row).push(s);
  }

  for (const rowSeats of byRow.values()) {
    rowSeats.sort(
      (a, b) =>
        (Number(a.x) || 0) - (Number(b.x) || 0) ||
        String(a.number ?? "").localeCompare(String(b.number ?? ""), undefined, { numeric: true })
    );
    const n = rowSeats.length;
    for (let i = 0; i < n; i++) {
      const mid = rowSeats[i];
      const midId = Number(mid.seatId);
      if (!Number.isFinite(midId) || blocked.has(midId)) continue;
      const leftId = i > 0 ? Number(rowSeats[i - 1].seatId) : NaN;
      const rightId = i < n - 1 ? Number(rowSeats[i + 1].seatId) : NaN;
      const leftBlocked = i > 0 && Number.isFinite(leftId) && blocked.has(leftId);
      const rightBlocked = i < n - 1 && Number.isFinite(rightId) && blocked.has(rightId);
      if (leftBlocked && rightBlocked) {
        const label = `${mid.row ?? ""}${mid.number ?? ""}`;
        return {
          ok: false,
          message: `Không được chừa 1 ghế trống lẻ giữa hàng (ghế ${label}). Chọn thêm ghế bên cạnh hoặc bỏ ghế khác.`,
        };
      }
    }
  }
  return { ok: true };
}
