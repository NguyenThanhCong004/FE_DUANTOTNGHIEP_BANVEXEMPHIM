import React from "react";
import { Pie } from "react-chartjs-2";
import "./chartSetup";
import { useTheme } from "../../../contexts/ThemeContext";
import { getCategoricalPalette } from "../../../utils/chartPalette";

export default function PieChartWidget({ labels, values, options }) {
  const { theme } = useTheme();
  const palette = getCategoricalPalette(theme);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        borderWidth: 2,
        borderColor: theme === "dark" ? "#111827" : "#ffffff",
      },
    ],
  };

  const mergedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: theme === "dark" ? "#c3c2b7" : "#52514e", usePointStyle: true, boxWidth: 8, padding: 12 },
      },
    },
    ...options,
  };

  return <Pie data={data} options={mergedOptions} />;
}
