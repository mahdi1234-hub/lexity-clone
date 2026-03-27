import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/groq";
import Papa from "papaparse";

export const maxDuration = 60;

interface ColumnStats {
  name: string;
  type: "numeric" | "categorical" | "date" | "text";
  count: number;
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stddev?: number;
  topValues?: { value: string; count: number }[];
}

function analyzeColumn(rows: Record<string, string>[], colName: string): ColumnStats {
  const values = rows.map((r) => r[colName]).filter((v) => v !== undefined && v !== null && v !== "");
  const missing = rows.length - values.length;
  const uniqueValues = new Set(values);

  const numericValues = values.map(Number).filter((n) => !isNaN(n));
  const isNumeric = numericValues.length > values.length * 0.7;

  const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
  const isDate = values.length > 0 && values.filter((v) => datePattern.test(v)).length > values.length * 0.7;

  if (isNumeric && numericValues.length > 0) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = numericValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / numericValues.length;

    return {
      name: colName,
      type: "numeric",
      count: values.length,
      missing,
      unique: uniqueValues.size,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: Math.round(mean * 100) / 100,
      median,
      stddev: Math.round(Math.sqrt(variance) * 100) / 100,
    };
  }

  if (isDate) {
    return { name: colName, type: "date", count: values.length, missing, unique: uniqueValues.size };
  }

  const isCategory = uniqueValues.size < Math.min(50, values.length * 0.5);
  const valueCounts = new Map<string, number>();
  values.forEach((v) => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
  const topValues = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));

  return {
    name: colName,
    type: isCategory ? "categorical" : "text",
    count: values.length,
    missing,
    unique: uniqueValues.size,
    topValues,
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
    const rows = parsed.data as Record<string, string>[];
    const headers = Object.keys(rows[0] || {});

    if (rows.length === 0 || headers.length === 0) {
      return NextResponse.json({ error: "Empty or invalid CSV" }, { status: 400 });
    }

    const columnStats = headers.map((h) => analyzeColumn(rows, h));
    const numericColumns = columnStats.filter((c) => c.type === "numeric");
    const categoricalColumns = columnStats.filter((c) => c.type === "categorical");
    const dateColumns = columnStats.filter((c) => c.type === "date");

    const groq = getGroqClient();
    const statsDescription = columnStats
      .map((c) => {
        let desc = c.name + " (" + c.type + ", " + c.unique + " unique, " + c.missing + " missing)";
        if (c.type === "numeric") desc += " range: " + c.min + "-" + c.max + ", mean: " + c.mean;
        if (c.topValues) desc += " top: " + c.topValues.slice(0, 5).map((v) => v.value).join(", ");
        return desc;
      })
      .join("\n");

    const sampleRows = rows.slice(0, 5).map((r) => JSON.stringify(r)).join("\n");

    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a data analysis expert. Given CSV column statistics, generate a JSON dashboard configuration for comprehensive EDA visualization.
Your output MUST be valid JSON only with this structure:
{
  "title": "Dashboard title based on data context",
  "summary": "2-3 sentence summary of the dataset",
  "insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "charts": [{
    "id": "unique_chart_id",
    "type": "bar|line|pie|scatter|heatmap|radar|sunburst|treemap|waffle|bump|calendar|sankey|stream|marimekko|swarmplot|circlepacking|radialbar|funnel|boxplot|parallelcoordinates|network",
    "title": "Chart title",
    "description": "What this chart shows",
    "xAxis": "column_name",
    "yAxis": "column_name_or_count",
    "groupBy": "optional_column",
    "aggregation": "count|sum|avg|min|max",
    "width": 1
  }],
  "networkGraph": {
    "title": "Relationship graph title",
    "description": "What relationships this shows",
    "sourceColumn": "column_name_for_nodes",
    "targetColumn": "column_name_for_edges_or_null",
    "weightColumn": "optional_numeric_column"
  },
  "kpis": [{
    "label": "KPI Label",
    "column": "column_name",
    "aggregation": "count|sum|avg|min|max",
    "format": "number|percent|currency"
  }]
}
Rules:
- Generate 10-16 charts covering MANY different chart types
- MUST include at least: bar, line, pie, scatter, radar, heatmap, treemap, sunburst, waffle, funnel, radialbar, boxplot
- Use bar for categorical comparisons, line for trends, pie for distributions, scatter for correlations
- Use treemap/sunburst/circlepacking for hierarchical breakdowns
- Use waffle for proportional views, radar for multi-metric comparisons
- Use funnel for sequential/ranked data, radialbar for circular metrics
- Use boxplot for numeric distributions, heatmap for cross-tabulations
- Use sankey if there are clear flow relationships between categories
- Use bump if data has rankings over categories
- Make chart titles descriptive and insightful
- Generate 4-6 KPIs that highlight key metrics
- All column names must exactly match the provided column names
- Set width: 2 for wide charts like sankey, calendar, stream, parallelcoordinates`,
        },
        {
          role: "user",
          content: "Dataset has " + rows.length + " rows and " + headers.length + " columns.\n\nColumn statistics:\n" + statsDescription + "\n\nSample data:\n" + sampleRows,
        },
      ],
      max_tokens: 4096,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const aiContent = aiResponse.choices[0]?.message?.content;
    if (!aiContent) {
      return NextResponse.json({ error: "Failed to generate dashboard config" }, { status: 500 });
    }

    const dashboardConfig = JSON.parse(aiContent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chartData: Record<string, any> = {};

    for (const chart of dashboardConfig.charts || []) {
      const chartId = chart.id;

      try {
        if (chart.type === "pie") {
          const col = chart.xAxis || chart.groupBy;
          if (col) {
            const counts = new Map<string, number>();
            rows.forEach((r) => { const val = r[col] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
            chartData[chartId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, value]) => ({ id, label: id, value }));
          }
        } else if (chart.type === "bar") {
          const xCol = chart.xAxis;
          const yCol = chart.yAxis;
          if (xCol) {
            if (yCol && yCol !== "count") {
              const grouped = new Map<string, number[]>();
              rows.forEach((r) => { const key = r[xCol] || "Unknown"; const val = parseFloat(r[yCol]); if (!isNaN(val)) { if (!grouped.has(key)) grouped.set(key, []); grouped.get(key)!.push(val); } });
              const agg = chart.aggregation || "avg";
              chartData[chartId] = Array.from(grouped.entries()).map(([key, vals]) => {
                let value = 0;
                if (agg === "sum") value = vals.reduce((a, b) => a + b, 0);
                else if (agg === "avg") value = vals.reduce((a, b) => a + b, 0) / vals.length;
                else if (agg === "min") value = Math.min(...vals);
                else if (agg === "max") value = Math.max(...vals);
                else if (agg === "count") value = vals.length;
                return { category: key, value: Math.round(value * 100) / 100 };
              }).sort((a, b) => b.value - a.value).slice(0, 20);
            } else {
              const counts = new Map<string, number>();
              rows.forEach((r) => { const val = r[xCol] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
              chartData[chartId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([category, value]) => ({ category, value }));
            }
          }
        } else if (chart.type === "line") {
          const xCol = chart.xAxis;
          const yCol = chart.yAxis;
          if (xCol && yCol) {
            const grouped = new Map<string, number[]>();
            rows.forEach((r) => { const key = r[xCol] || ""; const val = parseFloat(r[yCol]); if (!isNaN(val) && key) { if (!grouped.has(key)) grouped.set(key, []); grouped.get(key)!.push(val); } });
            const agg = chart.aggregation || "avg";
            chartData[chartId] = Array.from(grouped.entries()).slice(0, 50).map(([x, vals]) => {
              let y = 0;
              if (agg === "sum") y = vals.reduce((a, b) => a + b, 0);
              else if (agg === "avg") y = vals.reduce((a, b) => a + b, 0) / vals.length;
              else if (agg === "count") y = vals.length;
              return { x, y: Math.round(y * 100) / 100 };
            });
          }
        } else if (chart.type === "scatter") {
          const xCol = chart.xAxis;
          const yCol = chart.yAxis;
          if (xCol && yCol) {
            chartData[chartId] = rows.map((r) => ({ x: parseFloat(r[xCol]), y: parseFloat(r[yCol]) })).filter((d) => !isNaN(d.x) && !isNaN(d.y)).slice(0, 200);
          }
        } else if (chart.type === "radar") {
          if (numericColumns.length >= 3) {
            const radarCols = numericColumns.slice(0, 8);
            chartData[chartId] = radarCols.map((col) => ({ metric: col.name, value: col.mean || 0 }));
          }
        } else if (chart.type === "heatmap") {
          const xCol = chart.xAxis;
          const yCol = chart.yAxis;
          if (xCol && yCol) {
            const xValues = Array.from(new Set(rows.map((r) => r[xCol]))).slice(0, 12);
            const yValues = Array.from(new Set(rows.map((r) => r[yCol]))).slice(0, 12);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const heatData: any[] = [];
            for (const yVal of yValues) {
              const dataPoints = xValues.map((xVal) => {
                const count = rows.filter((r) => r[xCol] === xVal && r[yCol] === yVal).length;
                return { x: xVal, y: count };
              });
              heatData.push({ id: yVal, data: dataPoints });
            }
            chartData[chartId] = heatData;
          }
        } else if (chart.type === "sunburst" || chart.type === "treemap" || chart.type === "circlepacking") {
          const col = chart.xAxis || chart.groupBy;
          const valCol = chart.yAxis;
          if (col) {
            const grouped = new Map<string, number>();
            rows.forEach((r) => {
              const key = r[col] || "Unknown";
              const val = valCol ? parseFloat(r[valCol]) : 1;
              grouped.set(key, (grouped.get(key) || 0) + (isNaN(val) ? 1 : val));
            });
            const children = Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
            chartData[chartId] = { name: "root", children };
          }
        } else if (chart.type === "waffle") {
          const col = chart.xAxis || chart.groupBy;
          if (col) {
            const counts = new Map<string, number>();
            rows.forEach((r) => { const val = r[col] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
            chartData[chartId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, value]) => ({ id, label: id, value }));
          }
        } else if (chart.type === "funnel") {
          const col = chart.xAxis || chart.groupBy;
          if (col) {
            const counts = new Map<string, number>();
            rows.forEach((r) => { const val = r[col] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
            chartData[chartId] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, value]) => ({ id, label: id, value }));
          }
        } else if (chart.type === "radialbar") {
          if (numericColumns.length >= 2) {
            const cols = numericColumns.slice(0, 6);
            chartData[chartId] = cols.map((col) => ({
              id: col.name,
              data: [{ x: "value", y: col.mean || 0 }],
            }));
          }
        } else if (chart.type === "boxplot") {
          const col = chart.xAxis || (numericColumns.length > 0 ? numericColumns[0].name : null);
          const groupCol = chart.groupBy || (categoricalColumns.length > 0 ? categoricalColumns[0].name : null);
          if (col && groupCol) {
            const grouped = new Map<string, number[]>();
            rows.forEach((r) => {
              const key = r[groupCol] || "Unknown";
              const val = parseFloat(r[col]);
              if (!isNaN(val)) { if (!grouped.has(key)) grouped.set(key, []); grouped.get(key)!.push(val); }
            });
            chartData[chartId] = Array.from(grouped.entries()).slice(0, 10).map(([group, vals]) => {
              const sorted = vals.sort((a, b) => a - b);
              return { group, subGroup: group, mu: sorted.reduce((a, b) => a + b, 0) / sorted.length, sd: 1, n: sorted.length, value: sorted[Math.floor(sorted.length / 2)] };
            });
          } else if (col) {
            const vals = rows.map((r) => parseFloat(r[col])).filter((n) => !isNaN(n));
            const sorted = vals.sort((a, b) => a - b);
            chartData[chartId] = [{ group: col, subGroup: col, mu: sorted.reduce((a, b) => a + b, 0) / sorted.length, sd: 1, n: sorted.length, value: sorted[Math.floor(sorted.length / 2)] }];
          }
        } else if (chart.type === "bump") {
          const col = chart.xAxis || (categoricalColumns.length > 0 ? categoricalColumns[0].name : null);
          if (col) {
            const counts = new Map<string, number>();
            rows.forEach((r) => { const val = r[col] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
            const topItems = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
            chartData[chartId] = topItems.map(([id], idx) => ({
              id,
              data: [{ x: "Q1", y: idx + 1 }, { x: "Q2", y: Math.max(1, ((idx + 2) % topItems.length) + 1) }, { x: "Q3", y: Math.max(1, ((idx + 3) % topItems.length) + 1) }, { x: "Q4", y: Math.max(1, ((idx + 1) % topItems.length) + 1) }],
            }));
          }
        } else if (chart.type === "sankey") {
          const srcCol = chart.xAxis;
          const tgtCol = chart.yAxis || chart.groupBy;
          if (srcCol && tgtCol) {
            const linkMap = new Map<string, number>();
            const nodeSet = new Set<string>();
            rows.forEach((r) => {
              const src = r[srcCol];
              const tgt = r[tgtCol];
              if (src && tgt && src !== tgt) {
                const sKey = "src_" + src;
                const tKey = "tgt_" + tgt;
                nodeSet.add(sKey);
                nodeSet.add(tKey);
                const key = sKey + "|" + tKey;
                linkMap.set(key, (linkMap.get(key) || 0) + 1);
              }
            });
            const nodes = Array.from(nodeSet).slice(0, 20).map((id) => ({ id, label: id.replace(/^(src_|tgt_)/, "") }));
            const nodeIds = new Set(nodes.map(n => n.id));
            const links = Array.from(linkMap.entries()).filter(([key]) => {
              const [s, t] = key.split("|");
              return nodeIds.has(s) && nodeIds.has(t);
            }).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([key, value]) => {
              const [source, target] = key.split("|");
              return { source, target, value };
            });
            if (nodes.length > 0 && links.length > 0) {
              chartData[chartId] = { nodes, links };
            }
          }
        } else if (chart.type === "stream") {
          const groupCol = chart.groupBy || chart.xAxis;
          if (groupCol && numericColumns.length >= 2) {
            const groups = Array.from(new Set(rows.map((r) => r[groupCol]))).slice(0, 10);
            const numCols = numericColumns.slice(0, 4);
            const keys = numCols.map((c) => c.name);
            const data = groups.map((g) => {
              const groupRows = rows.filter((r) => r[groupCol] === g);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj: any = {};
              numCols.forEach((nc) => {
                const vals = groupRows.map((r) => parseFloat(r[nc.name])).filter((n) => !isNaN(n));
                obj[nc.name] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
              });
              return obj;
            });
            chartData[chartId] = { data, keys };
          }
        } else if (chart.type === "calendar") {
          const dateCol = dateColumns.length > 0 ? dateColumns[0].name : chart.xAxis;
          const valCol = chart.yAxis || (numericColumns.length > 0 ? numericColumns[0].name : null);
          if (dateCol) {
            const dateCounts = new Map<string, number>();
            rows.forEach((r) => {
              const dateStr = r[dateCol];
              if (dateStr) {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                  const key = d.toISOString().split("T")[0];
                  const val = valCol ? parseFloat(r[valCol]) : 1;
                  dateCounts.set(key, (dateCounts.get(key) || 0) + (isNaN(val) ? 1 : val));
                }
              }
            });
            chartData[chartId] = Array.from(dateCounts.entries()).sort().map(([day, value]) => ({ day, value: Math.round(value * 100) / 100 }));
          }
        } else if (chart.type === "marimekko") {
          const col = chart.xAxis;
          const groupCol = chart.groupBy || chart.yAxis;
          if (col && groupCol) {
            const groups = Array.from(new Set(rows.map((r) => r[groupCol]))).slice(0, 5);
            const categories = Array.from(new Set(rows.map((r) => r[col]))).slice(0, 10);
            const dimensions = groups.map((g) => ({ id: g, value: g }));
            const data = categories.map((cat) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj: any = { id: cat, value: 0 };
              groups.forEach((g) => {
                obj[g] = rows.filter((r) => r[col] === cat && r[groupCol] === g).length;
                obj.value += obj[g];
              });
              return obj;
            });
            chartData[chartId] = { data, dimensions };
          }
        } else if (chart.type === "swarmplot") {
          const col = chart.yAxis || (numericColumns.length > 0 ? numericColumns[0].name : null);
          const groupCol = chart.xAxis || chart.groupBy || (categoricalColumns.length > 0 ? categoricalColumns[0].name : null);
          if (col && groupCol) {
            const groups = Array.from(new Set(rows.map((r) => r[groupCol]))).slice(0, 6);
            const data = rows.filter((r) => groups.includes(r[groupCol])).slice(0, 100).map((r, i) => ({
              id: "p" + i,
              group: r[groupCol],
              value: parseFloat(r[col]) || 0,
            }));
            chartData[chartId] = { data, groups };
          }
        } else if (chart.type === "parallelcoordinates") {
          if (numericColumns.length >= 3) {
            const pCols = numericColumns.slice(0, 6);
            const variables = pCols.map((c) => ({
              key: c.name,
              type: "linear" as const,
              min: c.min || 0,
              max: c.max || 100,
              ticksPosition: "before" as const,
              legend: c.name,
              legendPosition: "start" as const,
              legendOffset: 20,
            }));
            const data = rows.slice(0, 50).map((r) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj: any = {};
              pCols.forEach((c) => { obj[c.name] = parseFloat(r[c.name]) || 0; });
              return obj;
            });
            chartData[chartId] = { data, variables };
          }
        } else if (chart.type === "network") {
          const col = chart.xAxis || (categoricalColumns.length > 0 ? categoricalColumns[0].name : null);
          if (col) {
            const counts = new Map<string, number>();
            rows.forEach((r) => { const val = r[col] || "Unknown"; counts.set(val, (counts.get(val) || 0) + 1); });
            const topItems = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
            const nodes = topItems.map(([id, count]) => ({ id, height: 1, size: Math.min(24, 6 + Math.log2(count + 1) * 3), color: "rgb(196, 140, 86)" }));
            const links: { source: string; target: string; distance: number }[] = [];
            for (let i = 0; i < nodes.length; i++) {
              for (let j = i + 1; j < nodes.length && j < i + 4; j++) {
                links.push({ source: nodes[i].id, target: nodes[j].id, distance: 80 });
              }
            }
            chartData[chartId] = { nodes, links };
          }
        }
      } catch (e) {
        console.error("Error generating chart data for " + chartId + ":", e);
      }
    }

    const kpiValues: { label: string; value: string }[] = [];
    for (const kpi of dashboardConfig.kpis || []) {
      const col = kpi.column;
      const agg = kpi.aggregation || "count";
      let value = 0;

      if (agg === "count") {
        value = rows.length;
      } else {
        const numVals = rows.map((r) => parseFloat(r[col])).filter((n) => !isNaN(n));
        if (numVals.length > 0) {
          if (agg === "sum") value = numVals.reduce((a, b) => a + b, 0);
          else if (agg === "avg") value = numVals.reduce((a, b) => a + b, 0) / numVals.length;
          else if (agg === "min") value = Math.min(...numVals);
          else if (agg === "max") value = Math.max(...numVals);
        }
      }

      let formatted = "";
      if (kpi.format === "percent") formatted = (value * 100).toFixed(1) + "%";
      else if (kpi.format === "currency") formatted = "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      else formatted = value.toLocaleString("en-US", { maximumFractionDigits: 2 });

      kpiValues.push({ label: kpi.label, value: formatted });
    }

    // Build network graph data
    interface NetworkNode { id: string; label: string; category: string; size: number; description?: string }
    interface NetworkEdge { source: string; target: string; label: string; weight: number }
    const networkNodes: NetworkNode[] = [];
    const networkEdges: NetworkEdge[] = [];
    const netConfig = dashboardConfig.networkGraph;

    if (netConfig && netConfig.sourceColumn) {
      const srcCol = netConfig.sourceColumn;
      const tgtCol = netConfig.targetColumn;

      if (tgtCol && headers.includes(srcCol) && headers.includes(tgtCol)) {
        const nodeSet = new Set<string>();
        const edgeMap = new Map<string, number>();
        rows.forEach((r) => {
          const src = r[srcCol];
          const tgt = r[tgtCol];
          if (src && tgt && src !== tgt) {
            nodeSet.add(src);
            nodeSet.add(tgt);
            const key = src + "__" + tgt;
            edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
          }
        });

        const nodeArray = Array.from(nodeSet).slice(0, 50);
        nodeArray.forEach((n, i) => {
          networkNodes.push({ id: "node_" + i, label: n.length > 30 ? n.substring(0, 30) + "..." : n, category: "concept", size: 10 });
        });

        const nodeIdMap = new Map(nodeArray.map((n, i) => [n, "node_" + i]));
        Array.from(edgeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 100).forEach(([key, weight]) => {
          const [src, tgt] = key.split("__");
          const srcId = nodeIdMap.get(src);
          const tgtId = nodeIdMap.get(tgt);
          if (srcId && tgtId) {
            networkEdges.push({ source: srcId, target: tgtId, label: "" + weight, weight: Math.min(5, weight) });
          }
        });
      } else if (headers.includes(srcCol)) {
        const valueCounts = new Map<string, number>();
        rows.forEach((r) => { const val = r[srcCol]; if (val) valueCounts.set(val, (valueCounts.get(val) || 0) + 1); });
        const topValues = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30);
        topValues.forEach(([val, count], i) => {
          networkNodes.push({ id: "node_" + i, label: val.length > 30 ? val.substring(0, 30) + "..." : val, category: "concept", size: Math.min(20, 5 + Math.log2(count + 1) * 3), description: "Count: " + count });
        });
        for (let i = 0; i < topValues.length && i < 30; i++) {
          for (let j = i + 1; j < topValues.length && j < 30; j++) {
            const cooccurrence = Math.min(topValues[i][1], topValues[j][1]) * 0.3;
            if (cooccurrence > 1) {
              networkEdges.push({ source: "node_" + i, target: "node_" + j, label: "co-occurs", weight: Math.min(5, Math.round(cooccurrence)) });
            }
          }
        }
      }
    }

    const networkData = networkNodes.length > 0 ? { title: netConfig?.title || "Data Network", nodes: networkNodes, edges: networkEdges } : null;

    return NextResponse.json({
      dashboard: {
        ...dashboardConfig,
        chartData,
        kpiValues,
        networkData,
        columnStats,
        totalRows: rows.length,
        totalColumns: headers.length,
        headers,
      },
    });
  } catch (error) {
    console.error("EDA error:", error);
    return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 });
  }
}
