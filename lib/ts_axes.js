import * as d3 from "d3";

/**
 * Creates x and y axes on the SVG.
 *
 * @param {d3.Selection} svg - SVG group element.
 * @param {d3.ScalePoint} xScale
 * @param {d3.ScaleLinear} yScale
 * @param {number} height - Plot area height.
 */
export function createAxes(svg, xScale, yScale, height) {
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text").style("font-size", "12px");

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(6));
}

/**
 * Creates axis labels.
 *
 * @param {d3.Selection} svg
 * @param {number} width
 * @param {number} height
 * @param {string} xLabel
 * @param {string} yLabel
 */
export function createAxisLabels(svg, width, height, xLabel, yLabel) {
  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2).attr("y", height + 45)
    .attr("text-anchor", "middle").style("font-size", "14px")
    .text(xLabel);

  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2).attr("y", -55)
    .attr("text-anchor", "middle").style("font-size", "14px")
    .text(yLabel);
}

/**
 * Creates the chart title.
 *
 * @param {d3.Selection} svg
 * @param {number} width
 * @param {string} title
 */
export function createTitle(svg, width, title) {
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2).attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px").style("font-weight", "bold")
    .text(title);
}
