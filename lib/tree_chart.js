import * as d3 from "d3";
import {
  make_tree, create_feature_map, radius_scale,
  update_tree, update_tree_labels, highlight_stack,
  toggle_node, create_search, populate_search,
  search_handler
} from "phylobar";
import { create_tree_svg, default_tree_opts } from "./tree_setup.js";

/**
 * Initializes the phylobar tree and wires hover/click/search
 * interactions.
 *
 * Callbacks:
 *   onHover(value, name) – called on mousemove with the
 *     averaged value array and node name
 *   onLockToggle()       – called when Space is pressed;
 *     parent decides lock state and calls set_locked()
 *
 * @param {HTMLElement} el - Container element.
 * @param {Object} treeData - Hierarchical tree JSON.
 * @param {Object} opts - Layout and callback options.
 * @returns {{ set_locked: Function }}
 */
export function init_tree(
  el, treeData,
  { width, height, tx, ty, palette, onHover, onLockToggle,
    svgHeightPadding = 120, treeHeightAdjust = 20 }
) {
  const svgW = width + 2 * tx;
  const svgH = height + ty + svgHeightPadding;

  el.color_ix = 0;
  el.frozen = false;

  const tree = make_tree(treeData, width, height);
  const feature_map = create_feature_map(tree);
  const color_sets = new Map(
    palette.map(c => [c, new Set()])
  );
  const rscale = radius_scale(tree);

  const svg = create_tree_svg(el, svgW, svgH, tx, ty);
  const link_gen = d3.linkVertical()
    .x(d => d.x).y(d => d.y);
  let nbr = d3.Delaunay.from(
    tree.descendants().map(d => [d.x + tx, d.y + ty])
  );
  const opts = default_tree_opts(svgW);

  update_tree(
    el, tree, rscale, link_gen, palette, color_sets
  );
  el.color_ix = 0;

  let locked = false;

  // Escape toggles freeze
  d3.select(el).on("keydown.freeze", ev => {
    if (ev.key === "Escape") el.frozen = !el.frozen;
  });

  // Space key → delegate to parent
  window.addEventListener("keydown", ev => {
    if (ev.key === " " || ev.code === "Space") {
      ev.preventDefault();
      onLockToggle();
    }
  });

  // Hover → highlight nearest node
  svg.on("mousemove", ev => {
    if (el.frozen || locked) return;
    const [mx, my] = d3.pointer(ev);
    const ix = nbr.find(mx, my);
    if (ix !== undefined && ix !== -1) {
      const f = tree.descendants()[ix];
      const name = f.data.name;
      const leafCount = f.leaves().length;
      const value = f.data.value.map(
        v => v / leafCount
      );
      onHover(value, name);
      for (const [, s] of color_sets) s.clear();
      highlight_stack(
        el, feature_map, name,
        palette, color_sets, opts
      );
    }
  });

  svg.on("mouseleave", () => {
    if (!locked) onHover(null, null);
  });

  // Click → collapse / expand node
  svg.on("click", ev => {
    if (el.frozen) return;
    const [mx, my] = d3.pointer(ev);
    const ix = nbr.find(mx, my);
    if (ix !== undefined && ix !== -1) {
      const f = tree.descendants()[ix];
      toggle_node(f);
      d3.tree().size([width, height - treeHeightAdjust])(tree);
      nbr = d3.Delaunay.from(
        tree.descendants().map(
          d => [d.x + tx, d.y + ty]
        )
      );
      update_tree(
        el, tree, rscale, link_gen,
        palette, color_sets
      );
      update_tree_labels(
        el, color_sets, feature_map,
        tree.descendants(), opts
      );
    }
  });

  create_search(el);
  populate_search(el, tree);
  search_handler(
    el, tree, palette, color_sets, feature_map, opts
  );

  return {
    set_locked(val) { locked = val; }
  };
}
