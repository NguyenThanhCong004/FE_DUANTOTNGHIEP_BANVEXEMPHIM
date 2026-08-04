import React from "react";
import { Line } from "react-chartjs-2";
import "./chartSetup";
import { useTheme } from "../../../contexts/ThemeContext";
import { getBaseChartOptions } from "../../../utils/chartTheme";
import { categoricalColor } from "../../../utils/chartPalette";

export default function LineChartWidget({ labels, datasets, options }) {
  const { theme } = useTheme();
  const base = getBaseChartOptions(theme);

  const data = {
    labels,
    datasets: datasets.map((ds, i) => {
      const color = ds.color || categoricalColor(theme, i);
      return {
        label: ds.label,
        data: ds.data,
        borderColor: color,
        backgroundColor: `${color}26`,
        pointBackgroundColor: color,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.3,
        fill: !!ds.fill,
      };
    }),
  };

  const mergedOptions = {
    ...base,
    plugins: {
      ...base.plugins,
      legend: { ...base.plugins.legend, display: datasets.length > 1 },
    },
    ...options,
  };

  return <Line data={data} options={mergedOptions} />;
}
