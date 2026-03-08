import * as d3 from "d3";
import { createSVG } from "./ts_svg.js";
import { createScales } from "./ts_scales.js";
import { createAxes, createAxisLabels, createTitle } from "./ts_axes.js";
import {
  buildSeries, createLineGenerator, createLines, createDots,
  setupLineHover, updateLineSelection, resetLines, formatSelectionOutput,
  dayColorScale
} from "./ts_lines.js";
import { createTimeboxManager, seriesPassesThrough } from "./ts_timebox.js";

/**
 * Creates an abundance timesearcher that can be updated when the user
 * clicks a different tree node or changes the PCA brush selection.
 *
 * @param {Object} opts
 * @param {Element|string} opts.container - DOM element or CSS selector.
 * @param {string[]} opts.allMice - Ordered list of all HFHS mouse IDs (23).
 * @param {string[]} opts.days - Ordered day labels, e.g. ["Day0","Day1","Day4","Day7"].
 * @param {Function} [opts.onSelectionChange] - Callback for timebox selection.
 * @param {number} [opts.width=750]
 * @param {number} [opts.height=380]
 * @returns {{ update: Function, clear: Function }}
 */
export function createAbundanceTimesearcher(opts) {
  const {
    container,
    allMice,
    days,
    onSelectionChange = () => {},
    width: totalW = 750,
    height: totalH = 380
  } = opts;

  const margin = { top: 40, right: 130, bottom: 65, left: 75 };
  const w = totalW - margin.left - margin.right;
  const h = totalH - margin.top - margin.bottom;

  let currentState = null; // holds references for teardown

  /**
   * Rebuilds the timesearcher for the given tree node and selected mice.
   *
   * @param {number[]} nodeValues - The node's value[] array (92 elements).
   * @param {string} nodeName - Display name of the selected tree node.
   * @param {string[]} mouseIds - Mouse IDs to show (from PCA brush).
   */
  function update(nodeValues, nodeName, mouseIds) {
    // Teardown previous chart
    d3.select(container).selectAll("*").remove();

    if (!nodeValues || !mouseIds || mouseIds.length === 0) {
      d3.select(container).append("p")
        .style("color", "#999").style("font-style", "italic")
        .text("Select a tree node and brush mice on the PCA plot.");
      return;
    }

    const filterSet = new Set(mouseIds);
    const series = buildSeries(nodeValues, allMice, days, filterSet);

    if (series.length === 0) return;

    const yMax = d3.max(series, s => d3.max(s.values, v => v.y));
    const { xScale, yScale } = createScales(days, yMax || 1, w, h);

    const svg = createSVG(container, totalW, totalH, margin);

    createAxes(svg, xScale, yScale, h);
    createAxisLabels(svg, w, h, "Day", "Abundance");
    createTitle(svg, w, `${nodeName} – Abundance over Time`);

    const lineGen = createLineGenerator(xScale, yScale);
    const lines = createLines(svg, series, lineGen);
    const dots = createDots(svg, series, xScale, yScale);

    // Day color legend (matching PCA)
    const lg = svg.append("g").attr("transform", `translate(${w + 15}, 0)`);
    lg.append("text").attr("y", -5).style("font-size", "12px")
      .style("font-weight", "bold").text("Day");
    days.forEach((day, i) => {
      const g = lg.append("g").attr("transform", `translate(0,${i * 22 + 12})`);
      g.append("circle").attr("r", 5).attr("fill", dayColorScale(day));
      g.append("text").attr("x", 14).attr("y", 4).style("font-size", "12px").text(day);
    });
    lg.append("text").attr("y", days.length * 22 + 28).style("font-size", "11px")
      .style("fill", "#888").text("Hover a line to");
    lg.append("text").attr("y", days.length * 22 + 42).style("font-size", "11px")
      .style("fill", "#888").text("see mouse ID");

    // Timebox state — tracked here so the hover getter can read it
    let timeboxActive = false;

    function onTimeboxUpdate(constraints) {
      if (constraints.length === 0) {
        timeboxActive = false;
        resetLines(lines, dots);
        onSelectionChange([]);
        return;
      }
      timeboxActive = true;
      const selectedSeries = [];
      const selectedMice = new Set();
      for (const s of series) {
        if (constraints.every(c => seriesPassesThrough(s, c, xScale))) {
          selectedMice.add(s.mouse);
          selectedSeries.push(s);
        }
      }
      updateLineSelection(lines, dots, selectedMice, true);
      onSelectionChange(selectedSeries);
    }

    const tbManager = createTimeboxManager(svg, w, h, xScale, yScale, onTimeboxUpdate);

    // Hover interaction — pass a getter so hover reads timebox state without owning it
    setupLineHover(svg, series, lines, dots, xScale, yScale, w, h, () => timeboxActive);

    currentState = { tbManager, lines, dots };
  }

  /** Clears the timesearcher contents. */
  function clear() {
    d3.select(container).selectAll("*").remove();
    d3.select(container).append("p")
      .style("color", "#999").style("font-style", "italic")
      .text("Select a tree node and brush mice on the PCA plot.");
    currentState = null;
  }

  /** Clears only timeboxes (keeps lines). */
  function clearTimeboxes() {
    if (currentState && currentState.tbManager) {
      currentState.tbManager.clearTimeboxes();
      resetLines(currentState.lines, currentState.dots);
    }
  }

  // Initial placeholder
  clear();

  return { update, clear, clearTimeboxes };
}
