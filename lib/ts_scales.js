import * as d3 from "d3";

/**
 * Creates x (point) and y (linear) scales for the abundance timesearcher.
 *
 * @param {string[]} days - Ordered day labels, e.g. ["Day0","Day1","Day4","Day7"].
 * @param {number} yMax - Maximum abundance value.
 * @param {number} width - Plot area width in pixels.
 * @param {number} height - Plot area height in pixels.
 * @param {number} [xPadding=0.1] - Fractional padding for x scale.
 * @param {number} [yDomainMult=1.08] - Multiplier for y domain max.
 * @returns {{ xScale: d3.ScalePoint, yScale: d3.ScaleLinear }}
 */
export function create_scales(days, yMax, width, height, xPadding = 0.1, yDomainMult = 1.08) {
  const xScale = d3.scalePoint()
    .domain(days)
    .range([0, width])
    .padding(xPadding);

  const yScale = d3.scaleLinear()
    .domain([0, yMax * yDomainMult])
    .range([height, 0])
    .nice();

  return { xScale, yScale };
}

/**
 * Creates a color scale for individual mice.
 *
 * @param {string[]} mouseIds - Array of mouse IDs.
 * @returns {d3.ScaleOrdinal}
 */
export function create_color_scale(mouseIds) {
  return d3.scaleOrdinal()
    .domain(mouseIds)
    .range(d3.schemeTableau10);
}
