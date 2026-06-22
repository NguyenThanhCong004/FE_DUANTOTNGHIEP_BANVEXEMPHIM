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

const AdminPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = "mục",
}) => {
  if (totalPages <= 1) return null;

  const first = (currentPage - 1) * itemsPerPage + 1;
  const last = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="admin-pagination-bar">
      <span className="admin-pagination-meta">
        Hiển thị {first}–{last} / {totalItems} {itemLabel}
      </span>
      <div className="admin-pagination">
        <button
          type="button"
          className="admin-pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="admin-pagination-btn"
              style={{ cursor: "default", opacity: 0.4, pointerEvents: "none" }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              className={`admin-pagination-btn${currentPage === page ? " active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}
        <button
          type="button"
          className="admin-pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
