import { asLength } from "./dimension.js";

// Each scale is a ratio: real inches per drawing inch.
export const SCALES = [
  {
    group: "Architectural",
    list: [
      ["1/16\" = 1'-0\"", 192], ["3/32\" = 1'-0\"", 128], ["1/8\" = 1'-0\"", 96], ["3/16\" = 1'-0\"", 64],
      ["1/4\" = 1'-0\"", 48], ["3/8\" = 1'-0\"", 32], ["1/2\" = 1'-0\"", 24], ["3/4\" = 1'-0\"", 16],
      ["1\" = 1'-0\"", 12], ["1-1/2\" = 1'-0\"", 8], ["3\" = 1'-0\"", 4], ["Full size (1:1)", 1],
    ],
  },
  {
    group: "Engineering",
    list: [
      ["1\" = 10'", 120], ["1\" = 20'", 240], ["1\" = 30'", 360], ["1\" = 40'", 480],
      ["1\" = 50'", 600], ["1\" = 60'", 720], ["1\" = 100'", 1200],
    ],
  },
  {
    group: "Metric",
    list: [
      ["1:5", 5], ["1:10", 10], ["1:20", 20], ["1:25", 25], ["1:50", 50],
      ["1:100", 100], ["1:200", 200], ["1:500", 500], ["1:1000", 1000],
    ],
  },
];

export const ALL_SCALES = SCALES.flatMap((g) => g.list);

/** Common scales shown in the comparison list. */
export const COMMON_RATIOS = [96, 48, 24, 12, 240, 20, 50, 100];

/** Parse a custom scale such as 3/16" = 1', 1" = 30' or 1:75. */
export function parseScale(str) {
  const s = str.trim();
  const m = s.match(/^1\s*:\s*([\d.]+)$/);
  if (m && +m[1] > 0) return +m[1];
  const parts = s.split("=");
  if (parts.length === 2) {
    const d = asLength(parts[0]), r = asLength(parts[1]);
    if (d > 0 && r > 0) return r / d;
  }
  throw new Error(`Can't read scale "${s}". Try 3/16" = 1' or 1:75.`);
}
