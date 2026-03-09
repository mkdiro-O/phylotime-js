import * as d3 from "d3";
import { is_in_brush } from "./pca_drawing.js";

/**
 * Creates multi-brush machinery for the PCA scatter plot.
 *
 * @param {d3.Selection} svg
 * @param {d3.Selection} points
 * @param {number} iW
 * @param {number} iH
 * @param {d3.ScaleLinear} xScale
 * @param {d3.ScaleLinear} yScale
 * @param {string[]} allMice
 * @param {Function} onMiceChange
 * @param {HTMLElement} outputEl
 * @param {Object} cfg
 * @param {number} cfg.pointOpacity - Default opacity.
 * @param {number} cfg.selectedScale - Magnification for selected points.
 * @returns {{ clear_all: Function }}
 */
export function create_multi_brush(
  svg, points, iW, iH, xScale, yScale,
  allMice, onMiceChange, outputEl, cfg
) {
  const { pointOpacity, selectedScale } = cfg;
  const brushes = [];
  const gB = svg.append("g").attr("class", "brushes");

  const getNode = id =>
    gB.select("#pca-brush-" + id).node();
  const getNodes = () =>
    gB.selectAll(".brush").nodes();

  function on_brush_update() {
    const nodes = getNodes();
    const sel = [];
    points.classed("selected", function (d) {
      const hit = nodes.some(
        n => is_in_brush(d, n, xScale, yScale)
      );
      if (hit) sel.push(d);
      return hit;
    });
    const any = nodes.some(n => d3.brushSelection(n));
    points
      .attr("opacity", function () {
        return any
          ? (d3.select(this).classed("selected") ? 1 : 0.2)
          : pointOpacity;
      })
      .attr("transform", function (d) {
        const s = d3.select(this)
          .classed("selected") ? selectedScale : 1;
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

  function add_brush() {
    const bid = brushes.length;
    const b = d3.brush()
      .extent([[0, 0], [iW, iH]])
      .on("brush", on_brush_update)
      .on("end", () => {
        const n = getNode(brushes[brushes.length - 1].id);
        const s = n ? d3.brushSelection(n) : null;
        if (s && s[0] !== s[1]) add_brush();
        draw();
        on_brush_update();
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

  function clear_all() {
    gB.selectAll(".brush").remove();
    brushes.length = 0;
    add_brush();
    draw();
    points.classed("selected", false)
      .attr("opacity", pointOpacity)
      .attr("transform",
        d => `translate(${xScale(d.x)},${yScale(d.y)})`);
    outputEl.textContent = "(No samples selected)";
    onMiceChange([]);
  }

  add_brush();
  draw();

  return { clear_all };
}
