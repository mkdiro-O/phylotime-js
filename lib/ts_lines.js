import * as d3 from "d3";

/** Day color scale matching the PCA plot */
const DAY_COLORS = ["#e41a1c","#377eb8","#4daf4a","#984ea3"];
const DAY_LABELS = ["Day0","Day1","Day4","Day7"];
export const dayColorScale = d3.scaleOrdinal().domain(DAY_LABELS).range(DAY_COLORS);

/**
 * Builds per-mouse time series from a node's value array.
 *
 * The value array is mouse-major: value[mouseIndex * nDays + dayIndex].
 *
 * @param {number[]} values - Flat abundance array from a tree node.
 * @param {string[]} mouseIds - Ordered mouse ID list (length N).
 * @param {string[]} days - Ordered day labels (length D).
 * @param {Set<string>|null} filterMice - If provided, only include these mice.
 * @returns {Array<{mouse: string, values: Array<{Day: string, y: number}>}>}
 */
export function buildSeries(values, mouseIds, days, filterMice) {
  const nDays = days.length;
  const series = [];
  mouseIds.forEach((mouse, mi) => {
    if (filterMice && !filterMice.has(mouse)) return;
    const pts = days.map((day, di) => ({
      Day: day,
      y: values[mi * nDays + di]
    }));
    series.push({ mouse, values: pts });
  });
  return series;
}

/**
 * Creates a D3 line generator for abundance over time.
 *
 * @param {d3.ScalePoint} xScale
 * @param {d3.ScaleLinear} yScale
 * @returns {d3.Line}
 */
export function createLineGenerator(xScale, yScale) {
  return d3.line()
    .x(d => xScale(d.Day))
    .y(d => yScale(d.y))
    .curve(d3.curveMonotoneX);
}

/** Default (unhighlighted) line color */
const LINE_COLOR = "#bbb";

/**
 * Draws time series lines on the SVG — uniform gray, no per-mouse color.
 */
export function createLines(svg, series, lineGen) {
  const g = svg.append("g").attr("class", "lines-group");
  return g.selectAll(".ts-line")
    .data(series)
    .enter().append("path")
    .attr("class", "ts-line")
    .attr("d", d => lineGen(d.values))
    .attr("fill", "none")
    .attr("stroke", LINE_COLOR)
    .attr("stroke-width", 1.2)
    .attr("opacity", 0.5);
}

/**
 * Draws dots at each data point along the lines — uniform gray.
 */
export function createDots(svg, series, xScale, yScale) {
  const g = svg.append("g").attr("class", "dots-group");
  return g.selectAll(".ts-dot")
    .data(series.flatMap(s => s.values.map(v => ({ ...v, mouse: s.mouse }))))
    .enter().append("circle")
    .attr("class", "ts-dot")
    .attr("cx", d => xScale(d.Day))
    .attr("cy", d => yScale(d.y))
    .attr("r", 2.5)
    .attr("fill", LINE_COLOR)
    .attr("stroke", "none")
    .attr("opacity", 0.4);
}

/**
 * Sets up closest-line hover interaction.
 * On mousemove, finds the nearest line and highlights it with
 * Day-matched PCA colors, showing the mouse ID in a tooltip.
 *
 * @param {d3.Selection} svg - Chart group element.
 * @param {Array} series - The series data array.
 * @param {d3.Selection} lines - Line path selections.
 * @param {d3.Selection} dots - Dot circle selections.
 * @param {d3.ScalePoint} xScale
 * @param {d3.ScaleLinear} yScale
 * @param {number} w - Chart width.
 * @param {number} h - Chart height.
 * @param {() => boolean} isTimeboxActive - Getter; returns true when timeboxes are active.
 */
export function setupLineHover(svg, series, lines, dots, xScale, yScale, w, h, isTimeboxActive) {
  // Tooltip label
  const tooltip = svg.append("g").attr("class", "ts-tooltip").style("display", "none");
  tooltip.append("rect")
    .attr("rx", 4).attr("ry", 4)
    .attr("fill", "#333").attr("fill-opacity", 0.85);
  tooltip.append("text")
    .attr("fill", "#fff").style("font-size", "12px").style("font-weight", "bold")
    .attr("text-anchor", "start").attr("dy", "0.35em");

  // Invisible overlay to capture mouse events
  const hoverOverlay = svg.append("rect")
    .attr("class", "hover-overlay")
    .attr("width", w).attr("height", h)
    .attr("fill", "none").attr("pointer-events", "all")
    .style("cursor", "default");

  // Precompute pixel coordinates per series for distance checks
  function getSeriesPixels() {
    return series.map(s => ({
      mouse: s.mouse,
      pts: s.values.map(v => [xScale(v.Day), yScale(v.y)])
    }));
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function findClosest(mx, my, pixSeries) {
    let best = null, bestDist = Infinity;
    for (const s of pixSeries) {
      for (let i = 0; i < s.pts.length - 1; i++) {
        const d = distToSegment(mx, my, s.pts[i][0], s.pts[i][1], s.pts[i+1][0], s.pts[i+1][1]);
        if (d < bestDist) { bestDist = d; best = s.mouse; }
      }
    }
    return bestDist < 40 ? best : null;
  }

  hoverOverlay.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event, svg.node());
    const pixSeries = getSeriesPixels();
    const closest = findClosest(mx, my, pixSeries);
    const tbActive = isTimeboxActive();

    if (!closest) {
      tooltip.style("display", "none");
      if (!tbActive) {
        lines.attr("stroke", LINE_COLOR).attr("stroke-width", 1.2).attr("opacity", 0.5);
        dots.attr("fill", LINE_COLOR).attr("opacity", 0.4).attr("r", 2.5);
      }
      return;
    }

    // Highlight closest line with Day colors
    lines
      .attr("stroke", d => d.mouse === closest ? "#555" : LINE_COLOR)
      .attr("stroke-width", d => d.mouse === closest ? 2.5 : 1.2)
      .attr("opacity", d => d.mouse === closest ? 1 : (tbActive ? 0.05 : 0.3));

    dots
      .attr("fill", d => d.mouse === closest ? dayColorScale(d.Day) : LINE_COLOR)
      .attr("opacity", d => d.mouse === closest ? 1 : (tbActive ? 0.05 : 0.2))
      .attr("r", d => d.mouse === closest ? 5 : 2.5);

    // Position tooltip near cursor
    const tipText = tooltip.select("text").text(closest);
    const bbox = tipText.node().getBBox();
    const padX = 8, padY = 4;
    const tipX = Math.min(mx + 14, w - bbox.width - padX * 2);
    const tipY = Math.max(my - 20, 0);
    tooltip.select("rect")
      .attr("x", tipX - padX).attr("y", tipY - bbox.height / 2 - padY)
      .attr("width", bbox.width + padX * 2).attr("height", bbox.height + padY * 2);
    tipText.attr("x", tipX).attr("y", tipY);
    tooltip.style("display", null).raise();
  });

  hoverOverlay.on("mouseleave", function() {
    tooltip.style("display", "none");
    if (!isTimeboxActive()) {
      lines.attr("stroke", LINE_COLOR).attr("stroke-width", 1.2).attr("opacity", 0.5);
      dots.attr("fill", LINE_COLOR).attr("opacity", 0.4).attr("r", 2.5);
    }
  });
}

/**
 * Updates visual state of lines/dots based on selected mice (timebox filtering).
 *
 * @param {d3.Selection} lines
 * @param {d3.Selection} dots
 * @param {Set<string>} selectedMice
 * @param {boolean} hasActive - Whether any timeboxes are active.
 */
export function updateLineSelection(lines, dots, selectedMice, hasActive) {
  if (!hasActive) {
    lines.attr("stroke", LINE_COLOR).attr("stroke-width", 1.2).attr("opacity", 0.5);
    dots.attr("fill", LINE_COLOR).attr("opacity", 0.4).attr("r", 2.5);
    return;
  }
  lines
    .attr("opacity", d => selectedMice.has(d.mouse) ? 0.7 : 0.05)
    .attr("stroke", d => selectedMice.has(d.mouse) ? "#888" : LINE_COLOR)
    .attr("stroke-width", d => selectedMice.has(d.mouse) ? 2 : 1);
  dots
    .attr("opacity", d => selectedMice.has(d.mouse) ? 1 : 0.05)
    .attr("fill", d => selectedMice.has(d.mouse) ? dayColorScale(d.Day) : LINE_COLOR)
    .attr("r", d => selectedMice.has(d.mouse) ? 4 : 2);
}

/**
 * Resets lines/dots to default state.
 */
export function resetLines(lines, dots) {
  lines.attr("stroke", LINE_COLOR).attr("stroke-width", 1.2).attr("opacity", 0.5);
  dots.attr("fill", LINE_COLOR).attr("opacity", 0.4).attr("r", 2.5);
}

/**
 * Formats selected series for display.
 *
 * @param {Array} selectedSeries
 * @returns {string}
 */
export function formatSelectionOutput(selectedSeries) {
  if (!selectedSeries || selectedSeries.length === 0) return "(No mice selected)";
  const ids = selectedSeries.map(s => s.mouse);
  return ids.join("\n") + "\n\n(" + ids.length + " mice selected)";
}
