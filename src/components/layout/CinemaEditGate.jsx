import React from "react";
import { useSuperAdminCinema } from "./useSuperAdminCinema";

export default function CinemaEditGate({ children }) {
  const { selectedCinemaId, selectedCinemaName } = useSuperAdminCinema();

  if (selectedCinemaId) return children;

  return (
    <div style={{ position: "relative" }}>
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(18,19,58,0.96)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 16,
            padding: "18px 20px",
            color: "#fff",
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, marginBottom: 6 }}>
            CẦN CHỌN RẠP
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
            Vui lòng chọn rạp ở thanh trên cùng của Super Admin để có thể chỉnh sửa.
            <br />
            Hiện tại: <span style={{ color: "rgba(212,226,25,0.95)" }}>{selectedCinemaName ?? "chưa chọn"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

