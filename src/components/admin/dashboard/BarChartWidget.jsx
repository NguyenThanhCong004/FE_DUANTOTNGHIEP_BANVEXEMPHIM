import React from "react";
import { Bar } from "react-chartjs-2";
import "./chartSetup";
import { useTheme } from "../../../contexts/ThemeContext";
import { getBaseChartOptions } from "../../../utils/chartTheme";
import { categoricalColor } from "../../../utils/chartPalette";

/**
 * Single or multi-series bar chart. `datasets` = [{ label, data }] — colors are
 * assigned in fixed categorical order, never cycled per-render.
 */
export default function BarChartWidget({ labels, datasets, horizontal = false, onBarClick, chartRef, options }) {
  const { theme } = useTheme();
  const base = getBaseChartOptions(theme);

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor || (ds.highlightIndex != null
        ? ds.data.map((_, idx) => (idx === ds.highlightIndex ? categoricalColor(theme, i) : `${categoricalColor(theme, i)}4d`))
        : categoricalColor(theme, i)),
      borderRadius: 4,
      maxBarThickness: 36,
    })),
  };

  const mergedOptions = {
    ...base,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      ...base.plugins,
      legend: { ...base.plugins.legend, display: datasets.length > 1 },
    },
    onClick: onBarClick,
    ...options,
  };

  return <Bar ref={chartRef} data={data} options={mergedOptions} />;
}
