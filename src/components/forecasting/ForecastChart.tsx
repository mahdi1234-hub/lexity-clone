"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

interface ForecastDataset {
  name: string;
  values: number[];
  type: "actual" | "forecast";
}

interface ConfidenceInterval {
  upper: number[];
  lower: number[];
  level: number;
}

interface ForecastChartProps {
  labels: string[];
  datasets: ForecastDataset[];
  confidence?: ConfidenceInterval;
  title?: string;
  width?: number;
  height?: number;
}

export default function ForecastChart({
  labels,
  datasets,
  confidence,
  title = "Forecast",
  width = 800,
  height = 400,
}: ForecastChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !labels.length || !datasets.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height);

    // Dark background for chart
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0a0c0a")
      .attr("rx", 8);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseDate = d3.timeParse("%Y-%m-%d") || d3.timeParse("%Y-%m-%dT%H:%M:%S");
    const dates = labels.map((l) => {
      const d = new Date(l);
      return isNaN(d.getTime()) ? new Date() : d;
    });

    // X scale
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dates) as [Date, Date])
      .range([0, w]);

    // Y scale - find min/max across all datasets and confidence
    let allValues: number[] = [];
    datasets.forEach((ds) => {
      allValues = allValues.concat(ds.values.filter((v) => v != null));
    });
    if (confidence) {
      allValues = allValues.concat(
        confidence.upper.filter((v) => v != null),
        confidence.lower.filter((v) => v != null)
      );
    }

    const yMin = d3.min(allValues) || 0;
    const yMax = d3.max(allValues) || 100;
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([h, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-dasharray", "3,3");

    // Confidence interval area
    if (confidence && confidence.upper.length > 0) {
      const forecastDataset = datasets.find((ds) => ds.type === "forecast");
      if (forecastDataset) {
        const forecastStartIdx = datasets.find((ds) => ds.type === "actual")?.values.length || 0;
        const ciDates = dates.slice(forecastStartIdx);

        const areaData = ciDates.map((date, i) => ({
          date,
          upper: confidence.upper[i] ?? 0,
          lower: confidence.lower[i] ?? 0,
        }));

        const area = d3
          .area<{ date: Date; upper: number; lower: number }>()
          .x((d) => xScale(d.date))
          .y0((d) => yScale(d.lower))
          .y1((d) => yScale(d.upper))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(areaData)
          .attr("fill", "rgba(120,200,180,0.15)")
          .attr("stroke", "none")
          .attr("d", area);

        // Upper bound line
        g.append("path")
          .datum(areaData)
          .attr("fill", "none")
          .attr("stroke", "rgba(120,200,180,0.3)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4")
          .attr(
            "d",
            d3
              .line<{ date: Date; upper: number; lower: number }>()
              .x((d) => xScale(d.date))
              .y((d) => yScale(d.upper))
              .curve(d3.curveMonotoneX)
          );

        // Lower bound line
        g.append("path")
          .datum(areaData)
          .attr("fill", "none")
          .attr("stroke", "rgba(120,200,180,0.3)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4,4")
          .attr(
            "d",
            d3
              .line<{ date: Date; upper: number; lower: number }>()
              .x((d) => xScale(d.date))
              .y((d) => yScale(d.lower))
              .curve(d3.curveMonotoneX)
          );
      }
    }

    // Color palette
    const colors = ["#78c8b4", "#e8a87c", "#d4a5a5", "#8cc0de", "#c9b1ff"];

    // Lines for each dataset
    datasets.forEach((dataset, idx) => {
      const lineData = dataset.values
        .map((val, i) => {
          if (dataset.type === "forecast") {
            const actualLen = datasets.find((ds) => ds.type === "actual")?.values.length || 0;
            return { date: dates[actualLen + i], value: val };
          }
          return { date: dates[i], value: val };
        })
        .filter((d) => d.value != null && d.date != null);

      const line = d3
        .line<{ date: Date; value: number }>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      const color = colors[idx % colors.length];
      const isDashed = dataset.type === "forecast";

      // Line path
      const path = g
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", dataset.type === "actual" ? 2 : 2.5)
        .attr("stroke-dasharray", isDashed ? "8,4" : "none")
        .attr("d", line);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", isDashed ? "8,4" : `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", isDashed ? 0 : totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

      // Data points
      g.selectAll(`.dot-${idx}`)
        .data(lineData.filter((_, i) => i % Math.max(1, Math.floor(lineData.length / 20)) === 0))
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 0)
        .attr("fill", color)
        .attr("stroke", "rgba(26,28,26,0.8)")
        .attr("stroke-width", 1.5)
        .transition()
        .delay((_, i) => 1500 + i * 50)
        .duration(300)
        .attr("r", 3.5);
    });

    // Vertical line at forecast start
    const actualDataset = datasets.find((ds) => ds.type === "actual");
    if (actualDataset && datasets.some((ds) => ds.type === "forecast")) {
      const forecastStartDate = dates[actualDataset.values.length - 1];
      if (forecastStartDate) {
        g.append("line")
          .attr("x1", xScale(forecastStartDate))
          .attr("x2", xScale(forecastStartDate))
          .attr("y1", 0)
          .attr("y2", h)
          .attr("stroke", "rgba(255,255,255,0.2)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "6,3");

        g.append("text")
          .attr("x", xScale(forecastStartDate) + 8)
          .attr("y", 15)
          .attr("fill", "rgba(255,255,255,0.5)")
          .attr("font-size", "10px")
          .attr("font-family", "'Syncopate', sans-serif")
          .attr("letter-spacing", "0.1em")
          .text("FORECAST");
      }
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => d3.timeFormat("%b %Y")(d as Date))
      )
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "10px")
      .attr("font-family", "'Cormorant Garamond', serif")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    g.selectAll(".domain").attr("stroke", "rgba(255,255,255,0.1)");
    g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.08)");

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "10px")
      .attr("font-family", "'Cormorant Garamond', serif");

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 24)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("font-size", "14px")
      .attr("font-family", "'Cormorant Garamond', serif")
      .attr("font-style", "italic")
      .attr("letter-spacing", "0.05em")
      .text(title);

    // Legend
    const legend = g
      .append("g")
      .attr("transform", `translate(${w - 180}, ${h + 40})`);

    datasets.forEach((ds, idx) => {
      const color = colors[idx % colors.length];
      legend
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", idx * 18)
        .attr("y2", idx * 18)
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", ds.type === "forecast" ? "6,3" : "none");

      legend
        .append("text")
        .attr("x", 28)
        .attr("y", idx * 18 + 4)
        .attr("fill", "rgba(255,255,255,0.6)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif")
        .text(ds.name);
    });

    if (confidence) {
      const ciIdx = datasets.length;
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", ciIdx * 18 - 6)
        .attr("width", 20)
        .attr("height", 12)
        .attr("fill", "rgba(120,200,180,0.15)")
        .attr("stroke", "rgba(120,200,180,0.3)")
        .attr("stroke-dasharray", "3,2");

      legend
        .append("text")
        .attr("x", 28)
        .attr("y", ciIdx * 18 + 4)
        .attr("fill", "rgba(255,255,255,0.6)")
        .attr("font-size", "10px")
        .attr("font-family", "'Cormorant Garamond', serif")
        .text(`${confidence.level}% CI`);
    }

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(26,28,26,0.95)")
      .style("border", "1px solid rgba(255,255,255,0.15)")
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("font-size", "11px")
      .style("font-family", "'Cormorant Garamond', serif")
      .style("color", "rgba(255,255,255,0.8)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    // Overlay for mouse tracking
    g.append("rect")
      .attr("width", w)
      .attr("height", h)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event);
        const xDate = xScale.invert(mx);
        const bisect = d3.bisector((d: Date) => d).left;
        const idx = bisect(dates, xDate);
        const closestDate = dates[Math.min(idx, dates.length - 1)];

        if (closestDate) {
          tooltip
            .style("opacity", 1)
            .style("left", `${event.offsetX + 15}px`)
            .style("top", `${event.offsetY - 10}px`)
            .html(
              `<div style="font-weight:600;margin-bottom:4px">${d3.timeFormat("%B %d, %Y")(closestDate)}</div>` +
                datasets
                  .map((ds, di) => {
                    const valIdx =
                      ds.type === "forecast"
                        ? idx - (datasets.find((d) => d.type === "actual")?.values.length || 0)
                        : idx;
                    const val = ds.values[valIdx];
                    if (val == null) return "";
                    return `<div style="color:${colors[di % colors.length]}">${ds.name}: ${val.toFixed(2)}</div>`;
                  })
                  .join("")
            );
        }
      })
      .on("mouseleave", function () {
        tooltip.style("opacity", 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [labels, datasets, confidence, title, width, height]);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto">
      <svg ref={svgRef} className="w-full" style={{ minWidth: width }} />
    </div>
  );
}
