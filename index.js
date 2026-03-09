// Tree
import { create_tree_svg, default_tree_opts } from "./lib/tree_setup.js";
import { init_tree } from "./lib/tree_chart.js";

// PCA
import {
  build_color_scale, build_group_shape_scale,
  extract_meta, point_encodings, build_scales
} from "./lib/pca_scales.js";
import { is_in_brush, draw_axes, draw_points, draw_legend } from "./lib/pca_drawing.js";
import { create_multi_brush } from "./lib/pca_brush.js";
import { init_pca } from "./lib/pca_chart.js";

// Timesearcher
import { create_svg } from "./lib/ts_svg.js";
import { create_scales, create_color_scale } from "./lib/ts_scales.js";
import { create_axes, create_axis_labels, create_title } from "./lib/ts_axes.js";
import {
  build_day_color_scale,
  build_series, create_line_generator, create_lines, create_dots,
  setup_line_hover, update_line_selection, reset_lines, format_selection_output
} from "./lib/ts_lines.js";
import { create_timebox_manager, series_passes_through } from "./lib/ts_timebox.js";
import { create_abundance_timesearcher } from "./lib/ts_chart.js";

export {
  // Tree
  create_tree_svg,
  default_tree_opts,
  init_tree,

  // PCA
  build_color_scale,
  build_group_shape_scale,
  extract_meta,
  point_encodings,
  build_scales,
  is_in_brush,
  draw_axes,
  draw_points,
  draw_legend,
  create_multi_brush,
  init_pca,

  // Timesearcher
  create_svg,
  create_scales,
  create_color_scale,
  create_axes,
  create_axis_labels,
  create_title,
  build_day_color_scale,
  build_series,
  create_line_generator,
  create_lines,
  create_dots,
  setup_line_hover,
  update_line_selection,
  reset_lines,
  format_selection_output,
  create_timebox_manager,
  series_passes_through,
  create_abundance_timesearcher
};
