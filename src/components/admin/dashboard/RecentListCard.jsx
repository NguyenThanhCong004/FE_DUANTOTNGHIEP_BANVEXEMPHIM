import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * Generic .admin-table list widget shared by every "recent X" panel on both
 * dashboards (invoices, audit log, admin activity, notifications, showtimes...).
 *
 * @param {{key:string,label:string,render?:(row)=>React.ReactNode,align?:'start'|'end'|'center'}[]} columns
 */
export default function RecentListCard({ title, headerRight, columns, rows, loading, error, emptyText = "Chưa có dữ liệu", rowKey, className = "" }) {
  return (
    <div className={`admin-card admin-slide-up ${className}`}>
      <div className="admin-card-header">
        <h4 className="mb-0">{title}</h4>
        {headerRight}
      </div>
      <div className="admin-card-body p-0">
        <div className="table-responsive">
          <table className="admin-table mb-0">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className={col.align ? `text-${col.align}` : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="text-center text-danger py-4 small">
                    {error}
                  </td>
                </tr>
              ) : !rows || rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <div className="admin-empty py-4">
                      <p className="mb-0">{emptyText}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={rowKey ? rowKey(row, idx) : idx}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.align ? `text-${col.align}` : undefined}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
