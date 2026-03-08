import * as d3 from "d3";
import {
  ALL_SHAPES,
  buildGroupShapeScale
} from "./pca_scales.js";

/** Check whether datum d falls inside the brush selection. */
export function isInBrush(d, node, xScale, yScale) {
  const s = d3.brushSelection(node);
  if (!s) return false;
  const px = xScale(d.x), py = yScale(d.y);
  return s[0][0] <= px && px <= s[1][0]
      && s[0][1] <= py && py <= s[1][1];
}

/* ── Drawing helpers ─────────────────────────────────────────────── */

export function drawAxes(
  svg, xScale, yScale, iW, iH, hasGroups
) {
  svg.append("g")
    .attr("transform", `translate(0,${iH})`)
    .call(d3.axisBottom(xScale).ticks(6));
  svg.append("g")
    .call(d3.axisLeft(yScale).ticks(6));

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
    .text(hasGroups ? "PCA (HFHS + Normal)" : "PCA");
}

export function drawPoints(svg, data, xScale, yScale, enc) {
  const sym = d3.symbol().size(80);
  return svg.selectAll(".point")
    .data(data).enter().append("path")
    .attr("class", "point")
    .attr("d", d => sym.type(enc.shape(d))())
    .attr("transform",
      d => `translate(${xScale(d.x)},${yScale(d.y)})`)
    .attr("fill", d => enc.fill(d))
    .attr("stroke", d => enc.stroke(d))
    .attr("stroke-width", d => enc.strokeWidth(d))
    .attr("opacity", 0.8)
    .each(function (d) {
      d3.select(this).append("title").text(enc.title(d));
    });
}

export function drawLegend(
  svg, iW, hasGroups, days, groups, colorScale
) {
  const sym = d3.symbol().size(80);
  const dayShapeScale = d3.scaleOrdinal()
    .domain(days)
    .range(ALL_SHAPES.slice(0, Math.max(days.length, 1)));
  const groupShapeScale = buildGroupShapeScale(groups);

  const lg = svg.append("g")
    .attr("transform", `translate(${iW + 15},0)`);
  lg.append("text")
    .attr("y", -5)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Day");

  days.forEach((day, i) => {
    const g = lg.append("g")
      .attr("transform", `translate(0,${i * 22 + 12})`);
    const shape = hasGroups
      ? d3.symbolCircle : dayShapeScale(day);
    g.append("path")
      .attr("d", sym.type(shape)())
      .attr("fill", colorScale(day))
      .attr("stroke", "#333");
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
        .attr("fill", "#888")
        .attr("stroke", "#333");
      g.append("text")
        .attr("x", 14).attr("y", 4)
        .style("font-size", "12px").text(grp);
    });
  }
}
