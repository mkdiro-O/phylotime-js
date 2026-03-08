import * as d3 from "d3";

/**
 * Creates the SVG skeleton for the tree panel: an outer SVG with
 * groups for links, nodes, and tree labels.
 *
 * @param {HTMLElement} el - Container element.
 * @param {number} svgW - Total SVG width.
 * @param {number} svgH - Total SVG height.
 * @param {number} tx - Horizontal translate offset.
 * @param {number} ty - Vertical translate offset.
 * @returns {d3.Selection} The root SVG selection.
 */
export function createTreeSVG(el, svgW, svgH, tx, ty) {
  const svg = d3.select(el)
    .append("svg")
    .attr("width", svgW)
    .attr("height", svgH);

  const treeG = svg.append("g")
    .attr("id", "tree")
    .attr("transform", `translate(${tx},${ty})`);
  treeG.append("g").attr("id", "links");
  treeG.append("g").attr("id", "nodes");

  // tree_labels appended to SVG root (not treeG)
  // so legend y-coords match SVG space
  svg.append("g").attr("id", "tree_labels");

  return svg;
}

/**
 * Returns default options for the tree panel layout.
 *
 * @param {number} svgW - Total SVG width.
 * @returns {Object} Default tree opts.
 */
export function defaultTreeOpts(svgW) {
  return {
    legend_mode: true,
    legend_x_start: 40,
    legend_spacing: 18,
    rel_width: 1,
    rel_height: 1,
    x_max: svgW,
    sample_label_margin: 12,
    sample_font_size: 9,
    sample_magnify: 1.3,
    sample_show_all: false
  };
}
