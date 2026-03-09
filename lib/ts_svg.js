import * as d3 from "d3";

/**
 * Creates the main SVG element with a transformed group for the chart area.
 *
 * @param {d3.Selection|Element|string} container - D3 selection, DOM element, or CSS selector.
 * @param {number} totalWidth - Total width of the SVG.
 * @param {number} totalHeight - Total height of the SVG.
 * @param {Object} margin - Margin object with top, right, bottom, left.
 * @returns {d3.Selection} The inner group element for drawing.
 */
export function create_svg(container, totalWidth, totalHeight, margin) {
  const sel = typeof container === "string"
    ? d3.select(container)
    : d3.select(container);

  return sel.append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}
