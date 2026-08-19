import React from "react";

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const delta = 2;
  const left = Math.max(2, currentPage - delta);
  const right = Math.min(totalPages - 1, currentPage + delta);
  const pages = [1];
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
};

/**
 * Phân trang cho các tab lịch sử ở trang Profile khách hàng (Giao dịch/Điểm/Voucher/Yêu thích).
 * `page` là 1-based (khớp UX hiển thị số trang); BE dùng page 0-based nên nơi gọi API tự trừ 1.
 * Tái dùng class `.pf-filter-btn` có sẵn trong Profile.jsx cho các nút số trang.
 */
const ProfilePagination = ({ page, totalPages, totalItems, pageSize, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const showMeta = totalItems != null && pageSize != null;
  const first = showMeta ? (page - 1) * pageSize + 1 : null;
  const last = showMeta ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className="pf-pagination-bar">
      {showMeta && (
        <span className="pf-pagination-meta">
          Hiển thị {first}–{last} / {totalItems}
        </span>
      )}
      <div className="pf-pagination">
        <button
          type="button"
          className="pf-filter-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Trang trước"
        >
          ‹
        </button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="pf-filter-btn"
              style={{ cursor: "default", opacity: 0.4, pointerEvents: "none" }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pf-filter-btn${page === p ? " active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="pf-filter-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default ProfilePagination;
