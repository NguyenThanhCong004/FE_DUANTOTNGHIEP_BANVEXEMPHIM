import React from "react";

export default function EmptyState({
  title = "Chưa có dữ liệu",
  subtitle = "BE hiện chưa cung cấp endpoint để hiển thị dữ liệu thật.",
  icon = "fas fa-info-circle",
  action,
}) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.55 }}>
        <i className={icon} />
      </div>
      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, marginBottom: 10 }}>{title}</div>
      <div style={{ maxWidth: 520, margin: "0 auto", lineHeight: 1.6, fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>
        {subtitle}
      </div>
      {action ? <div style={{ marginTop: 22 }}>{action}</div> : null}
    </div>
  );
}

