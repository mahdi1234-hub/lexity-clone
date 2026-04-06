"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

interface FrappeDataset {
  name: string;
  values: number[];
  chartType?: "bar" | "line";
}

interface FrappeChartWrapperProps {
  title?: string;
  type?: "bar" | "line" | "percentage" | "pie" | "heatmap";
  labels: string[];
  datasets: FrappeDataset[];
  height?: number;
  colors?: string[];
  barOptions?: { stacked?: boolean; spaceRatio?: number };
  lineOptions?: { dotSize?: number; regionFill?: number; hideDots?: boolean };
  axisOptions?: { xAxisMode?: string; yAxisMode?: string; xIsSeries?: boolean };
}

export default function FrappeChartWrapper({
  title = "Chart",
  type = "line",
  labels,
  datasets,
  height = 300,
  colors = ["#78c8b4", "#e8a87c", "#d4a5a5", "#8cc0de", "#c9b1ff"],
  lineOptions = { dotSize: 4, regionFill: 1, hideDots: false },
}: FrappeChartWrapperProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !labels.length || !datasets.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 760;
    const margin = { top: 35, right: 20, bottom: 50, left: 55 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Dark background for chart
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0a0c0a")
      .attr("rx", 8);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", "13px")
      .attr("font-family", "'Cormorant Garamond', serif")
      .attr("font-style", "italic")
      .text(title);

    if (type === "bar") {
      // Bar chart
      const x0 = d3.scaleBand().domain(labels).range([0, w]).padding(0.3);
      const x1 = d3
        .scaleBand()
        .domain(datasets.map((d) => d.name))
        .range([0, x0.bandwidth()])
        .padding(0.08);

      let allValues: number[] = [];
      datasets.forEach((ds) => {
        allValues = allValues.concat(ds.values);
      });
      const yMax = d3.max(allValues) || 100;
      const y = d3.scaleLinear().domain([0, yMax * 1.15]).range([h, 0]);

      // Grid
      g.append("g")
        .selectAll("line")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", (d: number) => y(d))
        .attr("y2", (d: number) => y(d))
        .attr("stroke", "rgba(255,255,255,0.06)")
        .attr("stroke-dasharray", "3,3");

      // Bars
      labels.forEach((label, li) => {
        datasets.forEach((ds, di) => {
          const xPos = (x0(label) || 0) + (x1(ds.name) || 0);
          const barHeight = h - y(ds.values[li] || 0);
          const color = colors[di % colors.length];

          g.append("rect")
            .attr("x", xPos)
            .attr("y", h)
            .attr("width", x1.bandwidth())
            .attr("height", 0)
            .attr("fill", color)
            .attr("opacity", 0.8)
            .attr("rx", 2)
            .transition()
            .duration(800)
            .delay(li * 100 + di * 50)
            .attr("y", y(ds.values[li] || 0))
            .attr("height", barHeight);

          // Value label
          g.append("text")
            .attr("x", xPos + x1.bandwidth() / 2)
            .attr("y", y(ds.values[li] || 0) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(255,255,255,0.5)")
            .attr("font-size", "9px")
            .attr("font-family", "'Cormorant Garamond', serif")
            .attr("opacity", 0)
            .text((ds.values[li] || 0).toFixed(1))
            .transition()
            .delay(800 + li * 100)
            .attr("opacity", 1);
        });
      });

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .selectAll("text")
        .attr("fill", "rgba(255,255,255,0.5)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end");

      g.selectAll(".domain").attr("stroke", "rgba(255,255,255,0.1)");

      // Y axis
      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .attr("fill", "rgba(255,255,255,0.4)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif");

      g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.08)");
    } else {
      // Line chart
      const x = d3.scalePoint().domain(labels).range([0, w]).padding(0.5);

      let allValues: number[] = [];
      datasets.forEach((ds) => {
        allValues = allValues.concat(ds.values.filter((v) => v != null));
      });
      const yMin = d3.min(allValues) || 0;
      const yMax = d3.max(allValues) || 100;
      const yPad = (yMax - yMin) * 0.15;
      const y = d3.scaleLinear().domain([yMin - yPad, yMax + yPad]).range([h, 0]);

      // Grid
      g.append("g")
        .selectAll("line")
        .data(y.ticks(5))
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", (d: number) => y(d))
        .attr("y2", (d: number) => y(d))
        .attr("stroke", "rgba(255,255,255,0.06)")
        .attr("stroke-dasharray", "3,3");

      datasets.forEach((ds, di) => {
        const color = colors[di % colors.length];
        const lineData = labels
          .map((label, i) => ({ label, value: ds.values[i] }))
          .filter((d) => d.value != null);

        const line = d3
          .line<{ label: string; value: number }>()
          .x((d) => x(d.label) || 0)
          .y((d) => y(d.value))
          .curve(d3.curveMonotoneX);

        // Region fill
        if (lineOptions?.regionFill) {
          const area = d3
            .area<{ label: string; value: number }>()
            .x((d) => x(d.label) || 0)
            .y0(h)
            .y1((d) => y(d.value))
            .curve(d3.curveMonotoneX);

          g.append("path")
            .datum(lineData)
            .attr("fill", color)
            .attr("opacity", 0.08)
            .attr("d", area);
        }

        // Line
        const path = g
          .append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("d", line);

        // Animate
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(1200)
          .ease(d3.easeCubicInOut)
          .attr("stroke-dashoffset", 0);

        // Dots
        if (!lineOptions?.hideDots) {
          g.selectAll(`.dot-${di}`)
            .data(lineData)
            .enter()
            .append("circle")
            .attr("cx", (d) => x(d.label) || 0)
            .attr("cy", (d) => y(d.value))
            .attr("r", 0)
            .attr("fill", color)
            .attr("stroke", "rgba(26,28,26,0.8)")
            .attr("stroke-width", 1.5)
            .transition()
            .delay((_, i) => 1200 + i * 40)
            .duration(200)
            .attr("r", lineOptions?.dotSize || 3.5);
        }
      });

      // X axis
      g.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .attr("fill", "rgba(255,255,255,0.5)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif");

      g.selectAll(".domain").attr("stroke", "rgba(255,255,255,0.1)");

      // Y axis
      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .selectAll("text")
        .attr("fill", "rgba(255,255,255,0.4)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif");

      g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.08)");
    }

    // Legend
    const legend = g.append("g").attr("transform", `translate(${w - 140}, ${h + 30})`);
    datasets.forEach((ds, i) => {
      const color = colors[i % colors.length];
      if (type === "bar") {
        legend
          .append("rect")
          .attr("x", 0)
          .attr("y", i * 16 - 5)
          .attr("width", 12)
          .attr("height", 10)
          .attr("fill", color)
          .attr("rx", 2)
          .attr("opacity", 0.8);
      } else {
        legend
          .append("line")
          .attr("x1", 0)
          .attr("x2", 16)
          .attr("y1", i * 16)
          .attr("y2", i * 16)
          .attr("stroke", color)
          .attr("stroke-width", 2);
      }
      legend
        .append("text")
        .attr("x", 20)
        .attr("y", i * 16 + 4)
        .attr("fill", "rgba(255,255,255,0.5)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif")
        .text(ds.name);
    });
  }, [title, type, labels, datasets, height, colors, lineOptions]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} className="w-full" style={{ minWidth: 400 }} />
    </div>
  );
}
