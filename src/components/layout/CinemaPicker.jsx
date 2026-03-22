import React from "react";
import { Building2 } from "lucide-react";
import { useSuperAdminCinema } from "./useSuperAdminCinema";

/**
 * Chọn rạp thao tác — đồng bộ context (sidebar + header Super Admin).
 * @param {"sidebar"|"header"} variant — header: dropdown trên thanh top (bắt buộc cho dữ liệu theo rạp).
 */
export default function CinemaPicker({ className = "", variant = "sidebar" }) {
  const { cinemas, selectedCinemaId, selectedCinemaName, setSelectedCinemaId } =
    useSuperAdminCinema();

  const selectId =
    variant === "header" ? "app-shell-header-cinema-select" : "app-shell-cinema-select";

  if (variant === "header") {
    return (
      <div className={`app-shell-header-cinema-picker ${className}`.trim()}>
        <Building2 size={16} className="app-shell-header-cinema-icon flex-shrink-0" aria-hidden />
        <label htmlFor={selectId} className="visually-hidden">
          Rạp đang thao tác
        </label>
        <select
          id={selectId}
          className="app-shell-header-cinema-select"
          value={selectedCinemaId ?? ""}
          onChange={(e) => setSelectedCinemaId(e.target.value || null)}
          aria-label="Chọn rạp để xem dữ liệu theo cinemaId"
        >
          <option value="">— Chọn rạp (bắt buộc) —</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || `Rạp #${c.id}`}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`app-shell-cinema-picker ${className}`.trim()}>
      <label htmlFor={selectId}>Rạp đang thao tác</label>
      <select
        id={selectId}
        value={selectedCinemaId ?? ""}
        onChange={(e) => setSelectedCinemaId(e.target.value || null)}
      >
        <option value="">-- Chọn rạp --</option>
        {cinemas.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <small>
        {selectedCinemaName
          ? `Đang chọn: ${selectedCinemaName} — đổi nhanh trên header hoặc tại đây.`
          : "Chưa chọn rạp — chọn trên header hoặc tại đây để mở phân hệ theo rạp."}
      </small>
    </div>
  );
}
