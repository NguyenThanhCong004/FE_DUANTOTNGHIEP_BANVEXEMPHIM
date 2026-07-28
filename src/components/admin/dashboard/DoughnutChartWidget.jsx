import React from "react";
import { Doughnut } from "react-chartjs-2";
import "./chartSetup";
import { useTheme } from "../../../contexts/ThemeContext";

/**
 * Two-slice occupancy-style doughnut (e.g. "sold" vs "remaining"), with a
 * centered ratio label rendered as regular DOM text (not a chart.js plugin)
 * to keep it simple and theme-aware.
 */
export default function DoughnutChartWidget({ soldLabel = "Đã bán", remainingLabel = "Còn trống", sold, total, colorSold = "#2a78d6", centerLabel }) {
  const { theme } = useTheme();
  const remaining = Math.max((total || 0) - (sold || 0), 0);
  const trackColor = theme === "dark" ? "#1a2333" : "#e1e0d9";

  const data = {
    labels: [soldLabel, remainingLabel],
    datasets: [
      {
        data: [sold || 0, remaining],
        backgroundColor: [colorSold, trackColor],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: theme === "dark" ? "#c3c2b7" : "#52514e", usePointStyle: true, boxWidth: 8, padding: 12 },
      },
      tooltip: { enabled: true },
    },
  };

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <Doughnut data={data} options={options} />
      {centerLabel ? (
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--admin-text)" }}>{centerLabel}</div>
        </div>
      ) : null}
    </div>
  );
}
