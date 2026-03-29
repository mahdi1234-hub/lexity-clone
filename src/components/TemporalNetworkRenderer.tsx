/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface TemporalNetworkData {
  title?: string;
  description?: string;
  nodes: Array<{
    id: string;
    label?: string;
    category?: string;
    color?: string;
    startTime?: string | number;
    endTime?: string | number;
  }>;
  events: Array<{
    id?: string;
    source: string;
    target: string;
    time: string | number;
    label?: string;
    type?: string;
    weight?: number;
    color?: string;
  }>;
  timeRange?: { start: string | number; end: string | number };
  layout?: "timeline" | "swimlane";
}

const CATEGORY_COLORS = [
  "#E57373", "#64B5F6", "#81C784", "#FFB74D", "#BA68C8",
  "#4DB6AC", "#FF8A65", "#F06292", "#AED581", "#90A4AE",
];

export default function TemporalNetworkRenderer({ config }: { config: TemporalNetworkData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const animRef = useRef<number | null>(null);

  const width = 640;
  const height = 400;
  const margin = { top: 30, right: 30, bottom: 60, left: 120 };

  useEffect(() => {
    if (!svgRef.current || !config.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Parse times
    const parsedEvents = config.events.map(e => ({
      ...e,
      parsedTime: typeof e.time === "string" ? new Date(e.time).getTime() : e.time as number,
    }));

    const allTimes = parsedEvents.map(e => e.parsedTime).filter(t => !isNaN(t));
    const minTime = config.timeRange ? (typeof config.timeRange.start === "string" ? new Date(config.timeRange.start).getTime() : config.timeRange.start) : Math.min(...allTimes);
    const maxTime = config.timeRange ? (typeof config.timeRange.end === "string" ? new Date(config.timeRange.end).getTime() : config.timeRange.end) : Math.max(...allTimes);

    if (!currentTime) setCurrentTime(maxTime as number);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([minTime as number, maxTime as number])
      .range([margin.left, width - margin.right]);

    const categories = Array.from(new Set(config.nodes.map(n => n.category || "default")));
    const colorScale = d3.scaleOrdinal<string>().domain(categories).range(CATEGORY_COLORS);

    const yScale = d3.scaleBand()
      .domain(config.nodes.map(n => n.id))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const g = svg.append("g");

    // Time axis
    const isDateBased = typeof config.events[0]?.time === "string";
    if (isDateBased) {
      const timeScale = d3.scaleTime()
        .domain([new Date(minTime as number), new Date(maxTime as number)])
        .range([margin.left, width - margin.right]);
      g.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(timeScale).ticks(6))
        .selectAll("text").attr("font-size", 10).attr("fill", "#666");
    } else {
      g.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(8))
        .selectAll("text").attr("font-size", 10).attr("fill", "#666");
    }

    // Y axis (node labels)
    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).tickFormat(id => {
        const node = config.nodes.find(n => n.id === id);
        return node?.label || id;
      }))
      .selectAll("text").attr("font-size", 10).attr("fill", "#666");

    // Grid lines
    g.append("g")
      .selectAll("line")
      .data(config.nodes)
      .enter().append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => (yScale(d.id) || 0) + yScale.bandwidth() / 2)
      .attr("y2", d => (yScale(d.id) || 0) + yScale.bandwidth() / 2)
      .attr("stroke", "#eee")
      .attr("stroke-width", 1);

    // Node timeline bars
    config.nodes.forEach(node => {
      const nodeEvents = parsedEvents.filter(e => e.source === node.id || e.target === node.id);
      if (nodeEvents.length === 0) return;
      const nodeStart = Math.min(...nodeEvents.map(e => e.parsedTime));
      const nodeEnd = Math.max(...nodeEvents.map(e => e.parsedTime));
      const y = (yScale(node.id) || 0) + yScale.bandwidth() / 2;

      g.append("line")
        .attr("x1", xScale(nodeStart))
        .attr("x2", xScale(nodeEnd))
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", colorScale(node.category || "default"))
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-linecap", "round");
    });

    // Event connections (arcs)
    parsedEvents.forEach(event => {
      const sourceY = (yScale(event.source) || 0) + yScale.bandwidth() / 2;
      const targetY = (yScale(event.target) || 0) + yScale.bandwidth() / 2;
      const x = xScale(event.parsedTime);
      const isActive = currentTime ? event.parsedTime <= currentTime : true;

      // Vertical connection line
      g.append("line")
        .attr("x1", x).attr("x2", x)
        .attr("y1", sourceY).attr("y2", targetY)
        .attr("stroke", event.color || colorScale(config.nodes.find(n => n.id === event.source)?.category || "default"))
        .attr("stroke-width", event.weight || 1.5)
        .attr("stroke-opacity", isActive ? 0.6 : 0.1)
        .attr("stroke-dasharray", event.type === "indirect" ? "3,3" : null);

      // Source dot
      g.append("circle")
        .attr("cx", x).attr("cy", sourceY).attr("r", 4)
        .attr("fill", event.color || colorScale(config.nodes.find(n => n.id === event.source)?.category || "default"))
        .attr("fill-opacity", isActive ? 1 : 0.2)
        .style("cursor", "pointer")
        .on("mouseover", (evt: any) => {
          setTooltip({ x: evt.offsetX, y: evt.offsetY, content: `${event.label || `${event.source} -> ${event.target}`} @ ${event.time}` });
        })
        .on("mouseout", () => setTooltip(null));

      // Target dot
      g.append("circle")
        .attr("cx", x).attr("cy", targetY).attr("r", 4)
        .attr("fill", event.color || colorScale(config.nodes.find(n => n.id === event.target)?.category || "default"))
        .attr("fill-opacity", isActive ? 1 : 0.2);
    });

    // Current time indicator
    if (currentTime) {
      g.append("line")
        .attr("x1", xScale(currentTime)).attr("x2", xScale(currentTime))
        .attr("y1", margin.top).attr("y2", height - margin.bottom)
        .attr("stroke", "#C48C56").attr("stroke-width", 2).attr("stroke-dasharray", "4,4");
    }

  }, [config, currentTime]);

  // Playback
  useEffect(() => {
    if (!playing) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const allTimes = config.events.map(e => typeof e.time === "string" ? new Date(e.time).getTime() : e.time as number);
    const minT = Math.min(...allTimes);
    const maxT = Math.max(...allTimes);
    const range = maxT - minT;
    const duration = 5000; // 5 second playback
    const startedAt = Date.now();
    const startTime = currentTime || minT;

    function animate() {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const t = startTime + progress * (maxT - startTime);
      setCurrentTime(t);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPlaying(false);
      }
    }
    animRef.current = requestAnimationFrame(animate);

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing]);

  return (
    <div className="w-full rounded-2xl bg-white/70 backdrop-blur-xl border border-[#FFB74D]/15 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 bg-white/40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#FFB74D]/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#FFB74D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            {config.title && <h3 className="text-sm font-semibold text-[#2C2824]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{config.title}</h3>}
            <span className="text-[10px] uppercase tracking-wider text-[#8B7B6B] font-medium">
              Temporal Network | {config.events.length} events
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentTime(null); setPlaying(false); }}
            className="p-1 rounded text-[10px] text-[#8B7B6B] hover:bg-black/5"
          >
            Reset
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className={`px-2.5 py-1 text-[10px] rounded-lg transition-colors ${playing ? "bg-[#FFB74D]/20 text-[#FFB74D]" : "bg-[#FFB74D]/10 text-[#FFB74D]"}`}
          >
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="w-full" />
        {tooltip && (
          <div className="absolute pointer-events-none bg-[#2C2824] text-white text-[10px] px-2 py-1 rounded-lg shadow-lg" style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}>
            {tooltip.content}
          </div>
        )}
      </div>

      {config.description && (
        <div className="px-4 py-2 border-t border-black/5">
          <p className="text-xs text-[#8B7B6B]">{config.description}</p>
        </div>
      )}
    </div>
  );
}
