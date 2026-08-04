import React from "react";
import { Spinner } from "react-bootstrap";

/**
 * .admin-card wrapper that standardizes loading/error/empty states around a chart
 * or any custom body content, at a fixed height so chart.js can size correctly.
 */
export default function ChartCard({ title, subtitle, headerRight, height = 320, loading, error, isEmpty, emptyText = "Chưa có dữ liệu", children }) {
  return (
    <div className="admin-card admin-slide-up h-100">
      <div className="admin-card-header">
        <div>
          <h4 className="mb-0">{title}</h4>
          {subtitle ? <div className="small text-muted mt-1">{subtitle}</div> : null}
        </div>
        {headerRight}
      </div>
      <div className="admin-card-body position-relative" style={{ height }}>
        {loading ? (
          <div className="d-flex align-items-center justify-content-center h-100">
            <Spinner animation="border" size="sm" />
          </div>
        ) : error ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-danger small text-center px-3">
            {error}
          </div>
        ) : isEmpty ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
