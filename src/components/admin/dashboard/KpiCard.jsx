import React from "react";

/**
 * A single KPI stat card — thin wrapper around the shared .admin-stat-card markup
 * (see src/styles/admin-design-system.css) used across the admin panel.
 */
export default function KpiCard({ title, value, color = "#2563eb", icon, hint, loading }) {
  return (
    <div className="admin-stat-card admin-slide-up" style={{ "--stat-color": color, "--icon-bg": `${color}1f` }}>
      {icon ? (
        <div className="admin-stat-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      ) : null}
      <div className="admin-stat-value">{loading ? "…" : value ?? 0}</div>
      <div className="admin-stat-label">{title}</div>
      {hint ? <div className="small text-muted mt-1">{hint}</div> : null}
    </div>
  );
}
