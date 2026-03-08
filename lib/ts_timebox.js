import * as d3 from "d3";

/**
 * Creates a timebox manager for rectangular query constraints.
 * Users draw timeboxes by clicking and dragging. Lines passing through
 * ALL active timeboxes are selected.
 *
 * @param {d3.Selection} svg - SVG group element.
 * @param {number} width - Plot width.
 * @param {number} height - Plot height.
 * @param {d3.ScalePoint} xScale
 * @param {d3.ScaleLinear} yScale
 * @param {Function} onTimeboxUpdate - Callback receiving constraint array.
 * @returns {Object} Timebox manager.
 */
export function createTimeboxManager(svg, width, height, xScale, yScale, onTimeboxUpdate) {
  let timeboxes = [];
  let nextId = 0;

  const overlay = svg.append("rect")
    .attr("class", "timebox-overlay")
    .attr("width", width).attr("height", height)
    .attr("fill", "none").attr("pointer-events", "all")
    .style("cursor", "crosshair");

  const tbGroup = svg.append("g").attr("class", "timebox-group");

  let drawingBox = null, startPt = null;

  overlay.on("mousedown", function(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const [mx, my] = d3.pointer(event, svg.node());
    startPt = { x: mx, y: my };
    drawingBox = tbGroup.append("rect")
      .attr("class", "timebox drawing")
      .attr("x", mx).attr("y", my).attr("width", 0).attr("height", 0)
      .attr("fill", "steelblue").attr("fill-opacity", 0.15)
      .attr("stroke", "steelblue").attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2");
  });

  d3.select("body").on("mousemove.abtimebox", function(event) {
    if (!drawingBox || !startPt) return;
    const [mx, my] = d3.pointer(event, svg.node());
    const x = Math.max(0, Math.min(startPt.x, mx));
    const y = Math.max(0, Math.min(startPt.y, my));
    const w = Math.min(Math.abs(mx - startPt.x), width - x);
    const h = Math.min(Math.abs(my - startPt.y), height - y);
    drawingBox.attr("x", x).attr("y", y).attr("width", w).attr("height", h);
  });

  d3.select("body").on("mouseup.abtimebox", function(event) {
    if (!drawingBox || !startPt) return;
    const [mx, my] = d3.pointer(event, svg.node());
    const x = Math.max(0, Math.min(startPt.x, mx));
    const y = Math.max(0, Math.min(startPt.y, my));
    const w = Math.min(Math.abs(mx - startPt.x), width - x);
    const h = Math.min(Math.abs(my - startPt.y), height - y);
    drawingBox.remove();
    drawingBox = null; startPt = null;
    if (w < 5 || h < 5) return;
    addTimebox(x, y, w, h);
  });

  function addTimebox(x, y, w, h) {
    const id = nextId++;
    const box = { id, x, y, w, h };
    timeboxes.push(box);

    const g = tbGroup.append("g").attr("class", "timebox").attr("id", `ab-timebox-${id}`);

    const rect = g.append("rect")
      .attr("x", x).attr("y", y).attr("width", w).attr("height", h)
      .attr("fill", "steelblue").attr("fill-opacity", 0.12)
      .attr("stroke", "steelblue").attr("stroke-width", 1.5)
      .style("cursor", "move");

    const cs = 14;
    const closeG = g.append("g").attr("class", "timebox-close")
      .attr("transform", `translate(${x + w - cs / 2},${y - cs / 2})`)
      .style("cursor", "pointer");
    closeG.append("circle").attr("r", cs / 2)
      .attr("fill", "#e41a1c").attr("stroke", "#fff").attr("stroke-width", 1);
    closeG.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("fill", "#fff").style("font-size", "10px").style("font-weight", "bold").text("×");

    closeG.on("click", function(event) {
      event.stopPropagation();
      removeTimebox(id);
    });

    const drag = d3.drag().on("drag", function(event) {
      const nx = Math.max(0, Math.min(event.x - box.w / 2, width - box.w));
      const ny = Math.max(0, Math.min(event.y - box.h / 2, height - box.h));
      box.x = nx; box.y = ny;
      rect.attr("x", nx).attr("y", ny);
      closeG.attr("transform", `translate(${nx + box.w - cs / 2},${ny - cs / 2})`);
      onTimeboxUpdate(getConstraints());
    });
    rect.call(drag);
    tbGroup.raise();
    onTimeboxUpdate(getConstraints());
  }

  function removeTimebox(id) {
    timeboxes = timeboxes.filter(b => b.id !== id);
    tbGroup.select(`#ab-timebox-${id}`).remove();
    onTimeboxUpdate(getConstraints());
  }

  function getConstraints() {
    return timeboxes.map(b => ({
      pixelX: b.x, pixelXMax: b.x + b.w,
      yMin: yScale.invert(b.y + b.h),
      yMax: yScale.invert(b.y)
    }));
  }

  function clearTimeboxes() {
    timeboxes = []; nextId = 0;
    tbGroup.selectAll(".timebox").remove();
    onTimeboxUpdate([]);
  }

  return { addTimebox, removeTimebox, clearTimeboxes, getConstraints };
}

/**
 * Checks whether a series passes through a timebox constraint.
 *
 * @param {Object} series - { mouse, values: [{Day, y}] }
 * @param {Object} c - { pixelX, pixelXMax, yMin, yMax }
 * @param {d3.ScalePoint} xScale
 * @returns {boolean}
 */
export function seriesPassesThrough(series, c, xScale) {
  const vals = series.values;
  for (let i = 0; i < vals.length; i++) {
    const px = xScale(vals[i].Day), py = vals[i].y;
    if (px >= c.pixelX && px <= c.pixelXMax && py >= c.yMin && py <= c.yMax) return true;
    if (i < vals.length - 1) {
      const px2 = xScale(vals[i + 1].Day), py2 = vals[i + 1].y;
      if (segIntersects(px, py, px2, py2, c.pixelX, c.pixelXMax, c.yMin, c.yMax)) return true;
    }
  }
  return false;
}

function segIntersects(px1, py1, px2, py2, bxMin, bxMax, byMin, byMax) {
  if (px1 > px2) [px1, py1, px2, py2] = [px2, py2, px1, py1];
  if (px2 < bxMin || px1 > bxMax) return false;
  const cl = Math.max(px1, bxMin), cr = Math.min(px2, bxMax);
  const t1 = px2 !== px1 ? (cl - px1) / (px2 - px1) : 0;
  const t2 = px2 !== px1 ? (cr - px1) / (px2 - px1) : 1;
  const y1 = py1 + t1 * (py2 - py1), y2 = py1 + t2 * (py2 - py1);
  return Math.max(y1, y2) >= byMin && Math.min(y1, y2) <= byMax;
}
