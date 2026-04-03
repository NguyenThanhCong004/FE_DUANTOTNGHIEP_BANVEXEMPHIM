import React from "react";
import Layout from "./Layout";

export default function NoApiData({ title, subtitle }) {
  return (
    <Layout>
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "rgba(20,22,50,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 22,
            color: "#fff",
          }}
        >
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 3, marginBottom: 10 }}>
            {title ?? "Chưa có API"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, lineHeight: 1.6 }}>
            {subtitle ?? "BE hiện chưa cung cấp endpoint để hiển thị dữ liệu thật cho màn hình này."}
          </div>
        </div>
      </div>
    </Layout>
  );
}

