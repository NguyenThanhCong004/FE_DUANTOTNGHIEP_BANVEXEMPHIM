/** Chart.js chrome (grid/ticks/legend) tuned per theme so charts stay readable in dark mode. */

const CHROME = {
  light: {
    ink: "#0b0b0b",
    secondaryInk: "#52514e",
    mutedInk: "#898781",
    gridline: "#e1e0d9",
    baseline: "#c3c2b7",
  },
  dark: {
    ink: "#ffffff",
    secondaryInk: "#c3c2b7",
    mutedInk: "#898781",
    gridline: "#2c2c2a",
    baseline: "#383835",
  },
};

export function getChartChrome(theme) {
  return CHROME[theme] || CHROME.light;
}

/** Base chart.js options with theme-aware axis/legend colors; merge chart-specific config on top. */
export function getBaseChartOptions(theme) {
  const chrome = getChartChrome(theme);
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: { color: chrome.secondaryInk, usePointStyle: true, boxWidth: 8 },
      },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
        titleColor: chrome.ink,
        bodyColor: chrome.secondaryInk,
        borderColor: chrome.gridline,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { color: chrome.gridline, display: false },
        ticks: { color: chrome.mutedInk, font: { size: 11 } },
        border: { color: chrome.baseline },
      },
      y: {
        grid: { color: chrome.gridline },
        ticks: { color: chrome.mutedInk, font: { size: 11 } },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
}
