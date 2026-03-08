import * as d3 from "d3";
import { isInBrush } from "./pca_drawing.js";

/**
 * Creates multi-brush machinery for the PCA scatter plot.
 * Users can draw multiple rectangular brushes; the union of all
 * brushed points determines the selected mice.
 *
 * @param {d3.Selection} svg - Chart group element.
 * @param {d3.Selection} points - Point path selections.
 * @param {number} iW - Inner plot width.
 * @param {number} iH - Inner plot height.
 * @param {d3.ScaleLinear} xScale
 * @param {d3.ScaleLinear} yScale
 * @param {string[]} allMice - All mouse IDs.
 * @param {Function} onMiceChange - Callback with selected mouse IDs.
 * @param {HTMLElement} outputEl - Element to display selection info.
 * @returns {{ clearAll: Function }}
 */
export function createMultiBrush(
  svg, points, iW, iH, xScale, yScale,
  allMice, onMiceChange, outputEl
) {
  const brushes = [];
  const gB = svg.append("g").attr("class", "brushes");

  const getNode = id =>
    gB.select("#pca-brush-" + id).node();
  const getNodes = () =>
    gB.selectAll(".brush").nodes();

  function onBrushUpdate() {
    const nodes = getNodes();
    const sel = [];
    points.classed("selected", function (d) {
      const hit = nodes.some(
        n => isInBrush(d, n, xScale, yScale)
      );
      if (hit) sel.push(d);
      return hit;
    });
    const any = nodes.some(n => d3.brushSelection(n));
    points
      .attr("opacity", function () {
        return any
          ? (d3.select(this).classed("selected") ? 1 : 0.2)
          : 0.8;
      })
      .attr("transform", function (d) {
        const s = d3.select(this)
          .classed("selected") ? 1.5 : 1;
        return `translate(${xScale(d.x)},${yScale(d.y)}) scale(${s})`;
      });
    outputEl.textContent = sel.length
      ? sel.map(d => d.sample_id).join("\n")
        + "\n\n(" + sel.length + " selected)"
      : "(No samples selected)";
    onMiceChange(
      allMice.filter(
        m => new Set(sel.map(d => d.mouse)).has(m)
      )
    );
  }

  function addBrush() {
    const bid = brushes.length;
    const b = d3.brush()
      .extent([[0, 0], [iW, iH]])
      .on("brush", onBrushUpdate)
      .on("end", () => {
        const n = getNode(brushes[brushes.length - 1].id);
        const s = n ? d3.brushSelection(n) : null;
        if (s && s[0] !== s[1]) addBrush();
        draw();
        onBrushUpdate();
      });
    brushes.push({ id: bid, brush: b });
  }

  function draw() {
    const n = brushes.length;
    const sel = gB.selectAll(".brush")
      .data(brushes, d => d.id);
    sel.enter().insert("g", ".brush")
      .attr("class", "brush")
      .attr("id", d => "pca-brush-" + d.id)
      .each(function (d) { d.brush(d3.select(this)); });
    sel.each(function (d) {
      d3.select(this).selectAll(".overlay")
        .style("pointer-events",
          d.id === n - 1 ? "all" : "none");
    });
    sel.exit().remove();
  }

  function clearAll() {
    gB.selectAll(".brush").remove();
    brushes.length = 0;
    addBrush();
    draw();
    points.classed("selected", false)
      .attr("opacity", 0.8)
      .attr("transform",
        d => `translate(${xScale(d.x)},${yScale(d.y)})`);
    outputEl.textContent = "(No samples selected)";
    onMiceChange([]);
  }

  addBrush();
  draw();

  return { clearAll };
}
