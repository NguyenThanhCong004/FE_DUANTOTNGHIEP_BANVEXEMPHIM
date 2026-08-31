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
  for (let i = left; i <= right; i += 1) pages.push(i);
  if (right < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
};

const PublicPagination = ({ page, totalItems, pageSize, onPageChange, className = "" }) => {
  const totalPages = Math.max(1, Math.ceil(Number(totalItems || 0) / Number(pageSize || 1)));
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(Number(page || 1), 1), totalPages);
  const first = (safePage - 1) * pageSize + 1;
  const last = Math.min(safePage * pageSize, totalItems);
  const pages = getPageNumbers(safePage, totalPages);

  return (
    <div className={`public-pagination ${className}`.trim()}>
      <style>{`
        .public-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 24px;
          flex-wrap: wrap;
        }
        .public-pagination__meta {
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          font-weight: 700;
        }
        .public-pagination__list {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-left: auto;
        }
        .public-pagination__btn {
          min-width: 34px;
          min-height: 34px;
          padding: 7px 11px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.045);
          color: rgba(255,255,255,0.56);
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          cursor: pointer;
          transition: border-color .2s, background .2s, color .2s, transform .2s;
        }
        .public-pagination__btn:hover:not(:disabled):not(.is-static) {
          border-color: rgba(212,226,25,0.45);
          color: #d4e219;
          transform: translateY(-1px);
        }
        .public-pagination__btn.is-active {
          background: #d4e219;
          border-color: #d4e219;
          color: #0f102a;
        }
        .public-pagination__btn:disabled,
        .public-pagination__btn.is-static {
          cursor: default;
          opacity: .42;
          transform: none;
        }
        @media (max-width: 575.98px) {
          .public-pagination {
            align-items: flex-start;
            flex-direction: column;
          }
          .public-pagination__list {
            justify-content: flex-start;
            margin-left: 0;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <span className="public-pagination__meta">{first}-{last} / {totalItems}</span>
      <div className="public-pagination__list">
        <button
          type="button"
          className="public-pagination__btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Trang truoc"
        >
          &lt;
        </button>

        {pages.map((p, idx) => (
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="public-pagination__btn is-static">...</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`public-pagination__btn${safePage === p ? " is-active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        ))}

        <button
          type="button"
          className="public-pagination__btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="Trang sau"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PublicPagination;
