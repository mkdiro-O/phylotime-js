import * as d3 from "d3";

/* ── Dynamic scale builders ──────────────────────────────────────── */

/**
 * A large palette for timepoints. Works for up to ~12 distinct values;
 * for more, d3.interpolateTurbo is used to generate evenly-spaced colors.
 */
export const BASE_COLORS = [
  "#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
  "#a65628","#f781bf","#999999","#66c2a5","#fc8d62",
  "#8da0cb","#e78ac3"
];

/** All available D3 symbol types for group encoding. */
export const ALL_SHAPES = [
  d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle,
  d3.symbolDiamond, d3.symbolStar, d3.symbolCross, d3.symbolWye
];

/** Build a color scale for an arbitrary list of day/timepoint labels. */
export function buildColorScale(days) {
  if (days.length <= BASE_COLORS.length) {
    return d3.scaleOrdinal()
      .domain(days)
      .range(BASE_COLORS.slice(0, days.length));
  }
  const colors = days.map(
    (_, i) => d3.interpolateTurbo(i / (days.length - 1))
  );
  return d3.scaleOrdinal().domain(days).range(colors);
}

/** Build a shape scale for an arbitrary list of group names. */
export function buildGroupShapeScale(groups) {
  return d3.scaleOrdinal()
    .domain(groups)
    .range(ALL_SHAPES.slice(0, Math.max(groups.length, 1)));
}

/* ── Pure helpers (no side-effects) ──────────────────────────────── */

/** Extract unique days and groups from the data. */
export function extractMeta(data) {
  const daySet = new Set();
  const groupSet = new Set();
  for (const d of data) {
    daySet.add(d.Day);
    if (d.group) groupSet.add(d.group);
  }
  const days = [...daySet];
  const groups = [...groupSet];
  return { days, groups, hasGroups: groups.length > 1 };
}

/**
 * Build visual encoding functions based on data-derived
 * days and groups.
 */
export function pointEncodings(days, groups, colorScale) {
  const hasGroups = groups.length > 1;
  const groupShapeScale = buildGroupShapeScale(groups);
  const dayShapeScale = d3.scaleOrdinal()
    .domain(days)
    .range(ALL_SHAPES.slice(0, Math.max(days.length, 1)));

  return {
    shape: hasGroups
      ? d => groupShapeScale(d.group)
      : d => dayShapeScale(d.Day),
    fill:        d => colorScale(d.Day),
    stroke:      () => "#333",
    strokeWidth: () => 1,
    title:       d =>
      `${d.mouse} (${d.Day}${d.group ? ", " + d.group : ""})`,
  };
}

/** Build x/y linear scales with 10 % padding. */
export function buildScales(data, iW, iH) {
  const pad = 0.1;
  const xE = d3.extent(data, d => d.x);
  const yE = d3.extent(data, d => d.y);
  const xR = xE[1] - xE[0];
  const yR = yE[1] - yE[0];
  return {
    xScale: d3.scaleLinear()
      .domain([xE[0] - xR * pad, xE[1] + xR * pad])
      .range([0, iW]),
    yScale: d3.scaleLinear()
      .domain([yE[0] - yR * pad, yE[1] + yR * pad])
      .range([iH, 0]),
  };
}
