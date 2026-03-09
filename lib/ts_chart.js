import * as d3 from "d3";
import { create_svg } from "./ts_svg.js";
import { create_scales } from "./ts_scales.js";
import { create_axes, create_axis_labels, create_title } from "./ts_axes.js";
import {
  build_day_color_scale, build_series, create_line_generator,
  create_lines, create_dots, setup_line_hover,
  update_line_selection, reset_lines
} from "./ts_lines.js";
import { create_timebox_manager, series_passes_through } from "./ts_timebox.js";

/**
 * Creates an abundance timesearcher that can be updated when the user
 * clicks a different tree node or changes the PCA brush selection.
 *
 * @param {Object} opts
 * @param {Element|string} opts.container
 * @param {string[]} opts.allMice - Ordered list of all subject IDs.
 * @param {string[]} opts.days - Ordered day/month labels.
 * @param {Function} [opts.onSelectionChange]
 * @param {number} [opts.width=750]
 * @param {number} [opts.height=380]
 * @param {Object} [opts.margin]
 * @param {string[]} [opts.colors] - Palette for day colors.
 * @param {string} [opts.lineColor="#bbb"]
 * @param {number} [opts.lineWidth=1.2]
 * @param {number} [opts.lineOpacity=0.5]
 * @param {number} [opts.dotRadius=2.5]
 * @param {number} [opts.dotOpacity=0.4]
 * @param {number} [opts.hoverThreshold=40]
 * @param {string} [opts.timeboxColor="steelblue"]
 * @param {number} [opts.xPadding=0.1]
 * @param {number} [opts.yDomainMult=1.08]
 * @param {string} [opts.timeLabel="Day"]
 * @param {string} [opts.yLabel="Abundance"]
 */
export function create_abundance_timesearcher(opts) {
  const {
    container,
    allMice,
    days,
    onSelectionChange = () => {},
    width: totalW = 750,
    height: totalH = 380,
    margin = { top: 40, right: 130, bottom: 65, left: 75 },
    colors = [
      "#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
      "#a65628","#f781bf","#999999","#66c2a5","#fc8d62",
      "#8da0cb","#e78ac3"
    ],
    lineColor = "#bbb",
    lineWidth = 1.2,
    lineOpacity = 0.5,
    dotRadius = 2.5,
    dotOpacity = 0.4,
    hoverThreshold = 40,
    timeboxColor = "steelblue",
    xPadding = 0.1,
    yDomainMult = 1.08,
    timeLabel = "Day",
    yLabel = "Abundance",
  } = opts;

  const w = totalW - margin.left - margin.right;
  const h = totalH - margin.top - margin.bottom;

  const dayColorScale = build_day_color_scale(days, colors);
  const style = { lineColor, lineWidth, lineOpacity, dotRadius, dotOpacity, hoverThreshold };

  let currentState = null;

  function update(nodeValues, nodeName, mouseIds) {
    d3.select(container).selectAll("*").remove();

    if (!nodeValues || !mouseIds || mouseIds.length === 0) {
      d3.select(container).append("p")
        .style("color", "#999").style("font-style", "italic")
        .text("Select a tree node and brush mice on the PCA plot.");
      return;
    }

    const filterSet = new Set(mouseIds);
    const series = build_series(nodeValues, allMice, days, filterSet);
    if (series.length === 0) return;

    const yMax = d3.max(series, s => d3.max(s.values, v => v.y));
    const { xScale, yScale } = create_scales(days, yMax || 1, w, h, xPadding, yDomainMult);

    const svg = create_svg(container, totalW, totalH, margin);

    create_axes(svg, xScale, yScale, h);
    create_axis_labels(svg, w, h, timeLabel, yLabel);
    create_title(svg, w, `${nodeName} \u2013 Abundance over Time`);

    const lineGen = create_line_generator(xScale, yScale);
    const lines = create_lines(svg, series, lineGen, style);
    const dots = create_dots(svg, series, xScale, yScale, style);

    // Day color legend
    const lg = svg.append("g").attr("transform", `translate(${w + 15}, 0)`);
    lg.append("text").attr("y", -5).style("font-size", "12px")
      .style("font-weight", "bold").text(timeLabel);
    days.forEach((day, i) => {
      const g = lg.append("g").attr("transform", `translate(0,${i * 22 + 12})`);
      g.append("circle").attr("r", 5).attr("fill", dayColorScale(day));
      g.append("text").attr("x", 14).attr("y", 4).style("font-size", "12px").text(day);
    });
    lg.append("text").attr("y", days.length * 22 + 28).style("font-size", "11px")
      .style("fill", "#888").text("Hover a line to");
    lg.append("text").attr("y", days.length * 22 + 42).style("font-size", "11px")
      .style("fill", "#888").text("see subject ID");

    let timeboxActive = false;

    function on_timebox_update(constraints) {
      if (constraints.length === 0) {
        timeboxActive = false;
        reset_lines(lines, dots, style);
        onSelectionChange([]);
        return;
      }
      timeboxActive = true;
      const selectedSeries = [];
      const selectedMice = new Set();
      for (const s of series) {
        if (constraints.every(c => series_passes_through(s, c, xScale))) {
          selectedMice.add(s.mouse);
          selectedSeries.push(s);
        }
      }
      update_line_selection(lines, dots, selectedMice, true, dayColorScale, style);
      onSelectionChange(selectedSeries);
    }

    const tbManager = create_timebox_manager(svg, w, h, xScale, yScale, on_timebox_update, timeboxColor);
    setup_line_hover(svg, series, lines, dots, xScale, yScale, w, h, () => timeboxActive, dayColorScale, style);

    currentState = { tbManager, lines, dots };
  }

  function clear() {
    d3.select(container).selectAll("*").remove();
    d3.select(container).append("p")
      .style("color", "#999").style("font-style", "italic")
      .text("Select a tree node and brush mice on the PCA plot.");
    currentState = null;
  }

  function clear_timeboxes() {
    if (currentState && currentState.tbManager) {
      currentState.tbManager.clear_timeboxes();
      reset_lines(currentState.lines, currentState.dots, style);
    }
  }

  clear();

  return { update, clear, clear_timeboxes };
}
