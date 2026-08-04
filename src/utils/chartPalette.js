/**
 * Categorical/sequential/status palette shared by every dashboard chart.
 * Values follow the validated reference palette (fixed hue order — never
 * cycled or re-sorted; CVD-safe adjacent pairs in both light and dark mode).
 */

export const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export const CATEGORICAL_DARK = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];

/** Blue sequential ramp, light -> dark (magnitude encoding, e.g. seat occupancy). */
export const SEQUENTIAL_BLUE = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export function getCategoricalPalette(theme) {
  return theme === "dark" ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

/** Picks the Nth categorical color, cycling only past slot 8 (documented fallback, not silent repeats within range). */
export function categoricalColor(theme, index) {
  const palette = getCategoricalPalette(theme);
  return palette[index % palette.length];
}
