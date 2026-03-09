import * as d3 from "d3";
import { build_group_shape_scale } from "./pca_scales.js";

/** Check whether datum d falls inside the brush selection. */
export function is_in_brush(d, node, xScale, yScale) {
  const s = d3.brushSelection(node);
  if (!s) return false;
  const px = xScale(d.x), py = yScale(d.y);
  return s[0][0] <= px && px <= s[1][0]
      && s[0][1] <= py && py <= s[1][1];
}

/**
 * @param {string} title - Chart title text.
 * @param {number} ticks - Number of axis ticks.
 */
export function draw_axes(svg, xScale, yScale, iW, iH, title, ticks) {
  svg.append("g")
    .attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(xScale).ticks(ticks));
  svg.append("g")
    .call(d3.axisLeft(yScale).ticks(ticks));

  svg.append("text")
    .attr("x", iW / 2).attr("y", iH + 42)
    .attr("text-anchor", "middle")
    .style("font-size", "13px").text("PC1");
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -iH / 2).attr("y", -48)
    .attr("text-anchor", "middle")
    .style("font-size", "13px").text("PC2");
  svg.append("text")
    .attr("x", iW / 2).attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "15px")
    .style("font-weight", "bold")
    .text(title);
}

/**
 * @param {number} pointSize - D3 symbol size.
 * @param {number} pointOpacity
 */
export function draw_points(svg, data, xScale, yScale, enc, pointSize, pointOpacity) {
  const sym = d3.symbol().size(pointSize);
  return svg.selectAll(".point")
    .data(data).enter().append("path")
    .attr("class", "point")
    .attr("d", d => sym.type(enc.shape(d))())
    .attr("transform",
      d => `translate(${xScale(d.x)},${yScale(d.y)})`)
    .attr("fill", d => enc.fill(d))
    .attr("stroke", d => enc.stroke(d))
    .attr("stroke-width", d => enc.strokeWidth(d))
    .attr("opacity", pointOpacity)
    .each(function (d) {
      d3.select(this).append("title").text(enc.title(d));
    });
}

/**
 * @param {Object} cfg
 * @param {string} cfg.timeLabel - Legend heading for time axis.
 * @param {d3.Symbol[]} cfg.shapes
 * @param {number} cfg.pointSize
 * @param {string} cfg.strokeColor
 * @param {string} cfg.groupFill
 */
export function draw_legend(svg, iW, hasGroups, days, groups, colorScale, cfg) {
  const { timeLabel, shapes, pointSize, strokeColor, groupFill } = cfg;
  const sym = d3.symbol().size(pointSize);
  const dayShapeScale = d3.scaleOrdinal()
    .domain(days)
    .range(shapes.slice(0, Math.max(days.length, 1)));
  const groupShapeScale = build_group_shape_scale(groups, shapes);

  const lg = svg.append("g")
    .attr("transform", `translate(${iW + 15},0)`);
  lg.append("text")
    .attr("y", -5)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(timeLabel);

  days.forEach((day, i) => {
    const g = lg.append("g")
      .attr("transform", `translate(0,${i * 22 + 12})`);
    const shape = hasGroups
      ? d3.symbolCircle : dayShapeScale(day);
    g.append("path")
      .attr("d", sym.type(shape)())
      .attr("fill", colorScale(day))
      .attr("stroke", strokeColor);
    g.append("text")
      .attr("x", 14).attr("y", 4)
      .style("font-size", "12px").text(day);
  });

  if (hasGroups) {
    const lgG = svg.append("g").attr("transform",
      `translate(${iW + 15},${days.length * 22 + 30})`);
    lgG.append("text")
      .attr("y", -5)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Group");
    groups.forEach((grp, i) => {
      const g = lgG.append("g")
        .attr("transform", `translate(0,${i * 22 + 12})`);
      g.append("path")
        .attr("d", sym.type(groupShapeScale(grp))())
        .attr("fill", groupFill)
        .attr("stroke", strokeColor);
      g.append("text")
        .attr("x", 14).attr("y", 4)
        .style("font-size", "12px").text(grp);
    });
  }
}
