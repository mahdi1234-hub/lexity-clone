"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";

export interface ObservablePlotData {
  plotType: string;
  title?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  marks?: Array<{
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any;
  }>;
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  color?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  facet?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMark(type: string, data: any[], options: any): Plot.Markish {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markMap: Record<string, any> = {
    dot: Plot.dot, line: Plot.line, areaY: Plot.areaY, areaX: Plot.areaX,
    area: Plot.areaY, barY: Plot.barY, barX: Plot.barX, bar: Plot.barY,
    cell: Plot.cell, rect: Plot.rect, rectX: Plot.rectX, rectY: Plot.rectY,
    ruleX: Plot.ruleX, ruleY: Plot.ruleY, rule: Plot.ruleY,
    tickX: Plot.tickX, tickY: Plot.tickY, tick: Plot.tickY,
    text: Plot.text, link: Plot.link, arrow: Plot.arrow, image: Plot.image,
    frame: Plot.frame, vector: Plot.vector, tree: Plot.tree,
    boxX: Plot.boxX, boxY: Plot.boxY, box: Plot.boxY,
    linearRegressionY: Plot.linearRegressionY, linearRegressionX: Plot.linearRegressionX,
    differenceY: Plot.differenceY,
    crosshair: Plot.crosshair, crosshairX: Plot.crosshairX, crosshairY: Plot.crosshairY,
    tip: Plot.tip, gridX: Plot.gridX, gridY: Plot.gridY,
    axisX: Plot.axisX, axisY: Plot.axisY,
    geo: Plot.geo, sphere: Plot.sphere, graticule: Plot.graticule,
    density: Plot.density, contour: Plot.contour, raster: Plot.raster,
    waffleX: Plot.waffleX, waffleY: Plot.waffleY, waffle: Plot.waffleY,
    hexbin: Plot.hexbin, lineY: Plot.lineY, lineX: Plot.lineX,
  };

  const fn = markMap[type];
  if (!fn) {
    console.warn(`Unknown mark type: ${type}, falling back to dot`);
    return Plot.dot(data, options);
  }

  const noDataMarks = ["frame", "gridX", "gridY", "axisX", "axisY", "sphere", "graticule"];
  if (noDataMarks.includes(type)) {
    return fn(options);
  }
  return fn(data, options);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPlotFromType(plotType: string, rawData: any, options: any): Plot.Markish[] {
  const data = Array.isArray(rawData) ? rawData : rawData?.data || rawData?.items || [];
  const marks: Plot.Markish[] = [];

  switch (plotType) {
    case "bar": case "barY":
      marks.push(Plot.barY(data, { x: options?.x || "label", y: options?.y || "value", fill: options?.fill || "#C48C56", ...options }));
      marks.push(Plot.ruleY([0]));
      break;
    case "barX":
      marks.push(Plot.barX(data, { y: options?.y || "label", x: options?.x || "value", fill: options?.fill || "#C48C56", ...options }));
      break;
    case "line":
      marks.push(Plot.line(data, { x: options?.x || "x", y: options?.y || "y", stroke: options?.stroke || "#C48C56", strokeWidth: 2, ...options }));
      marks.push(Plot.dot(data, { x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "#C48C56", r: 3 }));
      break;
    case "area": case "areaY":
      marks.push(Plot.areaY(data, { x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "#C48C56", fillOpacity: 0.3, ...options }));
      marks.push(Plot.line(data, { x: options?.x || "x", y: options?.y || "y", stroke: options?.stroke || "#C48C56", strokeWidth: 2 }));
      break;
    case "dot": case "scatter":
      marks.push(Plot.dot(data, { x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "#C48C56", r: options?.r || 4, ...options }));
      break;
    case "cell": case "heatmap":
      marks.push(Plot.cell(data, { x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "value", ...options }));
      break;
    case "rect": case "histogram":
      marks.push(Plot.rectY(data, Plot.binX({ y: "count" }, { x: options?.x || "value", fill: options?.fill || "#C48C56", ...options })));
      break;
    case "boxplot": case "box": case "boxY":
      marks.push(Plot.boxY(data, { x: options?.x || "category", y: options?.y || "value", fill: options?.fill || "#C48C56", ...options }));
      break;
    case "text":
      marks.push(Plot.text(data, { x: options?.x || "x", y: options?.y || "y", text: options?.text || "label", ...options }));
      break;
    case "vector":
      marks.push(Plot.vector(data, { x: options?.x || "x", y: options?.y || "y", rotate: options?.rotate || "angle", length: options?.length || "magnitude", ...options }));
      break;
    case "tree":
      marks.push(Plot.tree(data, { ...options }));
      break;
    case "link":
      marks.push(Plot.link(data, { x1: options?.x1 || "x1", y1: options?.y1 || "y1", x2: options?.x2 || "x2", y2: options?.y2 || "y2", ...options }));
      break;
    case "arrow":
      marks.push(Plot.arrow(data, { x1: options?.x1 || "x1", y1: options?.y1 || "y1", x2: options?.x2 || "x2", y2: options?.y2 || "y2", ...options }));
      break;
    case "density":
      marks.push(Plot.density(data, { x: options?.x || "x", y: options?.y || "y", fill: "density", ...options }));
      break;
    case "contour":
      marks.push(Plot.contour(data, { x: options?.x || "x", y: options?.y || "y", fill: "density", ...options }));
      break;
    case "hexbin":
      marks.push(Plot.dot(data, Plot.hexbin({ fill: "count", r: "count" }, { x: options?.x || "x", y: options?.y || "y", ...options })));
      break;
    case "waffle": case "waffleY":
      marks.push(Plot.waffleY(data, { x: options?.x || "label", y: options?.y || "value", fill: options?.fill || "#C48C56", ...options }));
      break;
    case "geo":
      marks.push(Plot.geo(data, { fill: options?.fill || "value", ...options }));
      break;
    case "regression": case "linearRegression":
      marks.push(Plot.dot(data, { x: options?.x || "x", y: options?.y || "y", fill: "#C48C56" }));
      marks.push(Plot.linearRegressionY(data, { x: options?.x || "x", y: options?.y || "y", stroke: "#E57373", strokeWidth: 2 }));
      break;
    case "stackedBar": case "stacked-bar":
      marks.push(Plot.barY(data, Plot.stackY({ x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "category", ...options })));
      marks.push(Plot.ruleY([0]));
      break;
    case "groupedBar": case "grouped-bar":
      marks.push(Plot.barY(data, Plot.dodgeX({ x: options?.x || "x", y: options?.y || "y", fill: options?.fill || "category", ...options })));
      marks.push(Plot.ruleY([0]));
      break;
    case "sparkline":
      marks.push(Plot.line(data, { x: options?.x || "x", y: options?.y || "y", stroke: "#C48C56", strokeWidth: 1.5 }));
      break;
    default:
      marks.push(Plot.dot(data, { x: options?.x || "x", y: options?.y || "y", fill: "#C48C56", ...options }));
  }

  return marks;
}

export default function ObservablePlotRenderer({ config }: { config: ObservablePlotData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const plotOptions: any = {
        width: config.width || 640,
        height: config.height || 400,
        style: { background: "transparent", fontSize: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif" },
        marginTop: 30, marginRight: 30, marginBottom: 40, marginLeft: 50,
      };

      if (config.xLabel) plotOptions.x = { label: config.xLabel };
      if (config.yLabel) plotOptions.y = { label: config.yLabel };
      if (config.color) plotOptions.color = config.color;
      if (config.facet) plotOptions.fx = config.facet;

      let marks: Plot.Markish[] = [];

      if (config.marks && Array.isArray(config.marks)) {
        marks = config.marks.map((m) => {
          const markData = m.data || (Array.isArray(config.data) ? config.data : []);
          return createMark(m.type, markData, m.options || {});
        });
      } else {
        marks = buildPlotFromType(config.plotType, config.data, config.options || {});
      }

      const plot = Plot.plot({ ...plotOptions, marks });

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(plot);

      return () => { plot.remove(); };
    } catch (err) {
      console.error("Observable Plot render error:", err);
      setError(err instanceof Error ? err.message : "Failed to render plot");
    }
  }, [config]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200">
        <p className="text-xs text-red-600">Plot error: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div ref={containerRef} className="observable-plot-container" />
    </div>
  );
}
