import * as d3 from "d3";
import {
  buildColorScale, extractMeta, pointEncodings, buildScales
} from "./pca_scales.js";
import { drawAxes, drawPoints, drawLegend } from "./pca_drawing.js";
import { createMultiBrush } from "./pca_brush.js";

/**
 * Initializes the PCA scatter plot with multi-brush selection.
 * Calls onMiceChange(mouseIdArray) whenever the brush selection
 * changes.
 *
 * @param {string|Element} containerSel - CSS selector or DOM element.
 * @param {Object} pcaData - { var_explained, points }.
 * @param {Object} opts
 * @param {string[]} opts.allMice - Ordered mouse ID list.
 * @param {Function} opts.onMiceChange - Callback with selected mice.
 */
export function initPCA(
  containerSel, pcaData, { allMice, onMiceChange }
) {
  const data = pcaData.points;
  const { days, groups, hasGroups } = extractMeta(data);
  const colorScale = buildColorScale(days);

  const margin = {
    top: 40, right: 140, bottom: 55, left: 65
  };
  const W = 460, H = 380;
  const iW = W - margin.left - margin.right;
  const iH = H - margin.top - margin.bottom;

  const svg = d3.select(containerSel)
    .append("svg").attr("width", W).attr("height", H)
    .append("g")
    .attr("transform",
      `translate(${margin.left},${margin.top})`);

  const { xScale, yScale } = buildScales(data, iW, iH);
  const enc = pointEncodings(days, groups, colorScale);

  drawAxes(svg, xScale, yScale, iW, iH, hasGroups);
  const points = drawPoints(
    svg, data, xScale, yScale, enc
  );
  drawLegend(
    svg, iW, hasGroups, days, groups, colorScale
  );

  const outputEl =
    document.getElementById("pca-selected");
  const { clearAll } = createMultiBrush(
    svg, points, iW, iH, xScale, yScale,
    allMice, onMiceChange, outputEl
  );

  document.getElementById("pca-clear-btn")
    .addEventListener("click", clearAll);
}
