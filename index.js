// Tree
import { createTreeSVG, defaultTreeOpts } from "./lib/tree_setup.js";
import { initTree } from "./lib/tree_chart.js";

// PCA
import {
  BASE_COLORS, ALL_SHAPES, buildColorScale, buildGroupShapeScale,
  extractMeta, pointEncodings, buildScales
} from "./lib/pca_scales.js";
import { isInBrush, drawAxes, drawPoints, drawLegend } from "./lib/pca_drawing.js";
import { createMultiBrush } from "./lib/pca_brush.js";
import { initPCA } from "./lib/pca_chart.js";

// Timesearcher
import { createSVG } from "./lib/ts_svg.js";
import { createScales, createColorScale } from "./lib/ts_scales.js";
import { createAxes, createAxisLabels, createTitle } from "./lib/ts_axes.js";
import {
  buildSeries, createLineGenerator, createLines, createDots,
  setupLineHover, updateLineSelection, resetLines, formatSelectionOutput,
  dayColorScale
} from "./lib/ts_lines.js";
import { createTimeboxManager, seriesPassesThrough } from "./lib/ts_timebox.js";
import { createAbundanceTimesearcher } from "./lib/ts_chart.js";

export {
  // Tree
  createTreeSVG,
  defaultTreeOpts,
  initTree,

  // PCA
  BASE_COLORS,
  ALL_SHAPES,
  buildColorScale,
  buildGroupShapeScale,
  extractMeta,
  pointEncodings,
  buildScales,
  isInBrush,
  drawAxes,
  drawPoints,
  drawLegend,
  createMultiBrush,
  initPCA,

  // Timesearcher
  createSVG,
  createScales,
  createColorScale,
  createAxes,
  createAxisLabels,
  createTitle,
  buildSeries,
  createLineGenerator,
  createLines,
  createDots,
  setupLineHover,
  updateLineSelection,
  resetLines,
  formatSelectionOutput,
  dayColorScale,
  createTimeboxManager,
  seriesPassesThrough,
  createAbundanceTimesearcher
};
