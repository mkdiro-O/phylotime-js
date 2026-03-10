import * as d3 from "d3";
import {
  build_color_scale, extract_meta, point_encodings, build_scales
} from "./pca_scales.js";
import { draw_axes, draw_points, draw_legend } from "./pca_drawing.js";
import { create_multi_brush } from "./pca_brush.js";

/**
 * Initializes the PCA scatter plot with multi-brush selection.
 *
 * @param {string|Element} containerSel - CSS selector or DOM element.
 * @param {Object} pcaData - { var_explained, points }.
 * @param {Object} opts
 * @param {string[]} opts.allSubjects - Ordered subject ID list.
 * @param {Function} opts.onSubjectsChange - Callback with selected IDs.
 * @param {string} [opts.title="PCA"] - Chart title.
 * @param {string} [opts.timeLabel="Day"] - Legend heading for time axis.
 * @param {number} [opts.width=460]
 * @param {number} [opts.height=380]
 * @param {Object} [opts.margin]
 * @param {string[]} [opts.colors] - Palette for timepoints.
 * @param {d3.Symbol[]} [opts.shapes] - Symbol types for groups/days.
 * @param {number} [opts.pointSize=80]
 * @param {number} [opts.pointOpacity=0.8]
 * @param {string} [opts.pointStroke="#333"]
 * @param {string} [opts.groupFill="#888"]
 * @param {number} [opts.ticks=6]
 * @param {number} [opts.domainPadding=0.1]
 * @param {number} [opts.selectedScale=1.5]
 */
export function init_pca(containerSel, pcaData, opts = {}) {
  const {
    allSubjects,
    onSubjectsChange,
    title = "PCA",
    timeLabel = "Day",
    width = 460,
    height = 380,
    margin = { top: 40, right: 140, bottom: 55, left: 65 },
    colors = [
      "#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
      "#a65628","#f781bf","#999999","#66c2a5","#fc8d62",
      "#8da0cb","#e78ac3"
    ],
    shapes = [
      d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle,
      d3.symbolDiamond, d3.symbolStar, d3.symbolCross, d3.symbolWye
    ],
    pointSize = 80,
    pointOpacity = 0.8,
    pointStroke = "#333",
    groupFill = "#888",
    ticks = 6,
    domainPadding = 0.1,
    selectedScale = 1.5,
  } = opts;

  const data = pcaData.points;
  const { days, groups, hasGroups } = extract_meta(data);
  const colorScale = build_color_scale(days, colors);

  const iW = width - margin.left - margin.right;
  const iH = height - margin.top - margin.bottom;

  const svg = d3.select(containerSel)
    .append("svg").attr("width", width).attr("height", height)
    .append("g")
    .attr("transform",
      `translate(${margin.left},${margin.top})`);

  const { xScale, yScale } = build_scales(data, iW, iH, domainPadding);
  const enc = point_encodings(days, groups, colorScale, shapes, pointStroke);

  draw_axes(svg, xScale, yScale, iW, iH, title, ticks);
  const points = draw_points(svg, data, xScale, yScale, enc, pointSize, pointOpacity);
  draw_legend(svg, iW, hasGroups, days, groups, colorScale,
    { timeLabel, shapes, pointSize, strokeColor: pointStroke, groupFill });

  const outputEl = document.getElementById("pca-selected");
  const { clear_all } = create_multi_brush(
    svg, points, iW, iH, xScale, yScale,
    allSubjects, onSubjectsChange, outputEl,
    { pointOpacity, selectedScale }
  );

  document.getElementById("pca-clear-btn")
    .addEventListener("click", clear_all);
}
