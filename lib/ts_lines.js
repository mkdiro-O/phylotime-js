import * as d3 from "d3";

/**
 * Builds a day/timepoint color scale from labels and colors.
 * @param {string[]} days
 * @param {string[]} colors
 * @returns {d3.ScaleOrdinal}
 */
export function build_day_color_scale(days, colors) {
  return d3.scaleOrdinal()
    .domain(days)
    .range(colors.slice(0, days.length));
}

/**
 * Builds per-subject time series from a node's value array.
 * The value array is subject-major: value[subjectIndex * nDays + dayIndex].
 */
export function build_series(values, subjectIds, days, filterSubjects) {
  const nDays = days.length;
  const series = [];
  subjectIds.forEach((subject, mi) => {
    if (filterSubjects && !filterSubjects.has(subject)) return;
    const pts = days.map((day, di) => ({
      timepoint: day,
      y: values[mi * nDays + di]
    }));
    series.push({ subject, values: pts });
  });
  return series;
}

/** Creates a D3 line generator for abundance over time. */
export function create_line_generator(xScale, yScale) {
  return d3.line()
    .x(d => xScale(d.timepoint))
    .y(d => yScale(d.y))
    .curve(d3.curveMonotoneX);
}

/**
 * Draws time series lines.
 * @param {Object} style - { lineColor, lineWidth, lineOpacity }
 */
export function create_lines(svg, series, lineGen, style) {
  const g = svg.append("g").attr("class", "lines-group");
  return g.selectAll(".ts-line")
    .data(series)
    .enter().append("path")
    .attr("class", "ts-line")
    .attr("d", d => lineGen(d.values))
    .attr("fill", "none")
    .attr("stroke", style.lineColor)
    .attr("stroke-width", style.lineWidth)
    .attr("opacity", style.lineOpacity);
}

/**
 * Draws dots at each data point along the lines.
 * @param {Object} style - { lineColor, dotRadius, dotOpacity }
 */
export function create_dots(svg, series, xScale, yScale, style) {
  const g = svg.append("g").attr("class", "dots-group");
  return g.selectAll(".ts-dot")
    .data(series.flatMap(s => s.values.map(v => ({ ...v, subject: s.subject }))))
    .enter().append("circle")
    .attr("class", "ts-dot")
    .attr("cx", d => xScale(d.timepoint))
    .attr("cy", d => yScale(d.y))
    .attr("r", style.dotRadius)
    .attr("fill", style.lineColor)
    .attr("stroke", "none")
    .attr("opacity", style.dotOpacity);
}

/**
 * Sets up closest-line hover interaction.
 * @param {d3.ScaleOrdinal} dayColorScale
 * @param {Object} style - { lineColor, lineWidth, lineOpacity, dotRadius, dotOpacity, hoverThreshold }
 */
export function setup_line_hover(svg, series, lines, dots, xScale, yScale, w, h, isTimeboxActive, dayColorScale, style) {
  const tooltip = svg.append("g").attr("class", "ts-tooltip").style("display", "none");
  tooltip.append("rect")
    .attr("rx", 4).attr("ry", 4)
    .attr("fill", "#333").attr("fill-opacity", 0.85);
  tooltip.append("text")
    .attr("fill", "#fff").style("font-size", "12px").style("font-weight", "bold")
    .attr("text-anchor", "start").attr("dy", "0.35em");

  const hoverOverlay = svg.append("rect")
    .attr("class", "hover-overlay")
    .attr("width", w).attr("height", h)
    .attr("fill", "none").attr("pointer-events", "all")
    .style("cursor", "default");

  function get_series_pixels() {
    return series.map(s => ({
      subject: s.subject,
      pts: s.values.map(v => [xScale(v.timepoint), yScale(v.y)])
    }));
  }

  function dist_to_segment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function find_closest(mx, my, pixSeries) {
    let best = null, bestDist = Infinity;
    for (const s of pixSeries) {
      for (let i = 0; i < s.pts.length - 1; i++) {
        const d = dist_to_segment(mx, my, s.pts[i][0], s.pts[i][1], s.pts[i+1][0], s.pts[i+1][1]);
        if (d < bestDist) { bestDist = d; best = s.subject; }
      }
    }
    return bestDist < style.hoverThreshold ? best : null;
  }

  hoverOverlay.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event, svg.node());
    const pixSeries = get_series_pixels();
    const closest = find_closest(mx, my, pixSeries);
    const tbActive = isTimeboxActive();

    if (!closest) {
      tooltip.style("display", "none");
      if (!tbActive) {
        lines.attr("stroke", style.lineColor).attr("stroke-width", style.lineWidth).attr("opacity", style.lineOpacity);
        dots.attr("fill", style.lineColor).attr("opacity", style.dotOpacity).attr("r", style.dotRadius);
      }
      return;
    }

    lines
      .attr("stroke", d => d.subject === closest ? "#555" : style.lineColor)
      .attr("stroke-width", d => d.subject === closest ? 2.5 : style.lineWidth)
      .attr("opacity", d => d.subject === closest ? 1 : (tbActive ? 0.05 : 0.3));

    dots
      .attr("fill", d => d.subject === closest ? dayColorScale(d.timepoint) : style.lineColor)
      .attr("opacity", d => d.subject === closest ? 1 : (tbActive ? 0.05 : 0.2))
      .attr("r", d => d.subject === closest ? style.dotRadius * 2 : style.dotRadius);

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
      lines.attr("stroke", style.lineColor).attr("stroke-width", style.lineWidth).attr("opacity", style.lineOpacity);
      dots.attr("fill", style.lineColor).attr("opacity", style.dotOpacity).attr("r", style.dotRadius);
    }
  });
}

/**
 * Updates visual state of lines/dots based on selected subjects.
 * @param {d3.ScaleOrdinal} dayColorScale
 * @param {Object} style - { lineColor, lineWidth, dotRadius }
 */
export function update_line_selection(lines, dots, selectedSubjects, hasActive, dayColorScale, style) {
  if (!hasActive) {
    reset_lines(lines, dots, style);
    return;
  }
  lines
    .attr("opacity", d => selectedSubjects.has(d.subject) ? 0.7 : 0.05)
    .attr("stroke", d => selectedSubjects.has(d.subject) ? "#888" : style.lineColor)
    .attr("stroke-width", d => selectedSubjects.has(d.subject) ? 2 : 1);
  dots
    .attr("opacity", d => selectedSubjects.has(d.subject) ? 1 : 0.05)
    .attr("fill", d => selectedSubjects.has(d.subject) ? dayColorScale(d.timepoint) : style.lineColor)
    .attr("r", d => selectedSubjects.has(d.subject) ? style.dotRadius * 1.6 : style.dotRadius * 0.8);
}

/**
 * Resets lines/dots to default state.
 * @param {Object} style - { lineColor, lineWidth, lineOpacity, dotRadius, dotOpacity }
 */
export function reset_lines(lines, dots, style) {
  lines.attr("stroke", style.lineColor).attr("stroke-width", style.lineWidth).attr("opacity", style.lineOpacity);
  dots.attr("fill", style.lineColor).attr("opacity", style.dotOpacity).attr("r", style.dotRadius);
}

/** Formats selected series for display. */
export function format_selection_output(selectedSeries) {
  if (!selectedSeries || selectedSeries.length === 0) return "(No subjects selected)";
  const ids = selectedSeries.map(s => s.subject);
  return ids.join("\n") + "\n\n(" + ids.length + " subjects selected)";
}
