import * as d3 from "d3";

/**
 * Build a color scale for an arbitrary list of day/timepoint labels.
 * @param {string[]} days
 * @param {string[]} colors - Palette array.
 */
export function build_color_scale(days, colors) {
  if (days.length <= colors.length) {
    return d3.scaleOrdinal()
      .domain(days)
      .range(colors.slice(0, days.length));
  }
  const generated = days.map(
    (_, i) => d3.interpolateTurbo(i / (days.length - 1))
  );
  return d3.scaleOrdinal().domain(days).range(generated);
}

/**
 * Build a shape scale for an arbitrary list of group names.
 * @param {string[]} groups
 * @param {d3.Symbol[]} shapes
 */
export function build_group_shape_scale(groups, shapes) {
  return d3.scaleOrdinal()
    .domain(groups)
    .range(shapes.slice(0, Math.max(groups.length, 1)));
}

/** Extract unique days and groups from the data. */
export function extract_meta(data) {
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
 * Build visual encoding functions.
 * @param {string[]} days
 * @param {string[]} groups
 * @param {d3.ScaleOrdinal} colorScale
 * @param {d3.Symbol[]} shapes
 * @param {string} strokeColor
 */
export function point_encodings(days, groups, colorScale, shapes, strokeColor) {
  const hasGroups = groups.length > 1;
  const groupShapeScale = build_group_shape_scale(groups, shapes);
  const dayShapeScale = d3.scaleOrdinal()
    .domain(days)
    .range(shapes.slice(0, Math.max(days.length, 1)));

  return {
    shape: hasGroups
      ? d => groupShapeScale(d.group)
      : d => dayShapeScale(d.Day),
    fill:        d => colorScale(d.Day),
    stroke:      () => strokeColor,
    strokeWidth: () => 1,
    title:       d =>
      `${d.mouse} (${d.Day}${d.group ? ", " + d.group : ""})`,
  };
}

/**
 * Build x/y linear scales with configurable padding.
 * @param {Object[]} data
 * @param {number} iW
 * @param {number} iH
 * @param {number} padding - Fractional domain padding (e.g. 0.1).
 */
export function build_scales(data, iW, iH, padding) {
  const xE = d3.extent(data, d => d.x);
  const yE = d3.extent(data, d => d.y);
  const xR = xE[1] - xE[0];
  const yR = yE[1] - yE[0];
  return {
    xScale: d3.scaleLinear()
      .domain([xE[0] - xR * padding, xE[1] + xR * padding])
      .range([0, iW]),
    yScale: d3.scaleLinear()
      .domain([yE[0] - yR * padding, yE[1] + yR * padding])
      .range([iH, 0]),
  };
}
