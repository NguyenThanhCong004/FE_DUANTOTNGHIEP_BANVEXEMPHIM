/**
 * Khớp BE SeatLayoutRules: không chừa đúng 1 ghế trống kẹp giữa hai ghế đã chiếm trên cùng hàng.
 *
 * Chỉ báo lỗi khi CHÍNH lựa chọn hiện tại làm phát sinh ghế mồ côi MỚI — nếu ghế mồ côi đã tồn tại
 * sẵn (vd. do quầy bán vé tạo ra ở giao dịch khác), không chặn các lựa chọn khác không liên quan.
 */
function findOrphanSeatIds(allSeats, blockedSeatIds, isCoupleSeat) {
  const orphans = new Set();
  const byRow = new Map();
  for (const s of allSeats) {
    if (s.seatId == null) continue;
    const row = s.y != null ? String(s.y) : (s.row != null ? String(s.row) : "?");
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
      if (!Number.isFinite(midId) || blockedSeatIds.has(midId)) continue;
      // Ghế đôi không bị coi là "mồ côi" — cho phép chọn ghế đôi cách quãng.
      if (isCoupleSeat && isCoupleSeat(mid)) continue;
      const leftId = i > 0 ? Number(rowSeats[i - 1].seatId) : NaN;
      const rightId = i < n - 1 ? Number(rowSeats[i + 1].seatId) : NaN;
      const leftBlocked = i > 0 && Number.isFinite(leftId) && blockedSeatIds.has(leftId);
      const rightBlocked = i < n - 1 && Number.isFinite(rightId) && blockedSeatIds.has(rightId);
      if (leftBlocked && rightBlocked) orphans.add(midId);
    }
  }
  return orphans;
}

/**
 * @param {Array<{ seatId: any, row?: string, number?: string|number, x?: number }>} allSeats
 * @param {Set<number>|number[]} existingBlockedSeatIds — ghế đã bị chiếm TRƯỚC lựa chọn hiện tại (đã bán ∪ peer đang chọn)
 * @param {Set<number>|number[]} newlySelectedSeatIds — ghế đang chọn trong lượt này
 * @param {(seat: object) => boolean} [isCoupleSeat] — trả true nếu seat là ghế đôi (loại khỏi rule mồ côi)
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function checkNoNewSingleSeatOrphanInRows(allSeats, existingBlockedSeatIds, newlySelectedSeatIds, isCoupleSeat) {
  if (!allSeats?.length) return { ok: true };

  const before = existingBlockedSeatIds instanceof Set ? existingBlockedSeatIds : new Set(existingBlockedSeatIds);
  const orphansBefore = findOrphanSeatIds(allSeats, before, isCoupleSeat);

  const after = new Set(before);
  for (const id of newlySelectedSeatIds instanceof Set ? newlySelectedSeatIds : newlySelectedSeatIds || []) {
    const n = Number(id);
    if (Number.isFinite(n)) after.add(n);
  }
  const orphansAfter = findOrphanSeatIds(allSeats, after, isCoupleSeat);

  for (const id of orphansAfter) {
    if (!orphansBefore.has(id)) {
      const seat = allSeats.find((s) => Number(s.seatId) === id);
      const label = seat ? `${seat.row ?? ""}${seat.number ?? ""}` : "";
      return {
        ok: false,
        message: `Không được chừa 1 ghế trống lẻ giữa hàng (ghế ${label}). Chọn thêm ghế bên cạnh hoặc bỏ ghế khác.`,
      };
    }
  }
  return { ok: true };
}
