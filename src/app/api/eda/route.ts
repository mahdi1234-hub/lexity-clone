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
          content: `You are a data analysis expert. Given CSV column statistics, generate a JSON dashboard configuration for EDA visualization.
Your output MUST be valid JSON only with this structure:
{
  "title": "Dashboard title based on data context",
  "summary": "2-3 sentence summary",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "charts": [{
    "id": "unique_chart_id",
    "type": "bar|line|pie|scatter|heatmap|radar",
    "title": "Chart title",
    "description": "What this chart shows",
    "xAxis": "column_name",
    "yAxis": "column_name_or_count",
    "groupBy": "optional_column",
    "aggregation": "count|sum|avg|min|max",
    "width": 1,
    "height": 1
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
- Generate 4-8 charts that best represent the data
- Mix chart types appropriately
- Use bar for categorical comparisons, line for trends, pie for distributions, scatter for correlations
- Make chart titles descriptive and insightful
- Generate 3-5 KPIs that highlight key metrics
- All column names must exactly match the provided column names`,
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
    const chartData: Record<string, any[]> = {};

    for (const chart of dashboardConfig.charts || []) {
      const chartId = chart.id;

      if (chart.type === "pie") {
        const col = chart.xAxis || chart.groupBy;
        if (col) {
          const counts = new Map<string, number>();
          rows.forEach((r) => {
            const val = r[col] || "Unknown";
            counts.set(val, (counts.get(val) || 0) + 1);
          });
          chartData[chartId] = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([id, value]) => ({ id, label: id, value }));
        }
      } else if (chart.type === "bar") {
        const xCol = chart.xAxis;
        const yCol = chart.yAxis;
        if (xCol) {
          if (yCol && yCol !== "count") {
            const grouped = new Map<string, number[]>();
            rows.forEach((r) => {
              const key = r[xCol] || "Unknown";
              const val = parseFloat(r[yCol]);
              if (!isNaN(val)) {
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(val);
              }
            });
            const agg = chart.aggregation || "avg";
            chartData[chartId] = Array.from(grouped.entries())
              .map(([key, vals]) => {
                let value = 0;
                if (agg === "sum") value = vals.reduce((a, b) => a + b, 0);
                else if (agg === "avg") value = vals.reduce((a, b) => a + b, 0) / vals.length;
                else if (agg === "min") value = Math.min(...vals);
                else if (agg === "max") value = Math.max(...vals);
                else if (agg === "count") value = vals.length;
                return { category: key, value: Math.round(value * 100) / 100 };
              })
              .sort((a, b) => b.value - a.value)
              .slice(0, 20);
          } else {
            const counts = new Map<string, number>();
            rows.forEach((r) => {
              const val = r[xCol] || "Unknown";
              counts.set(val, (counts.get(val) || 0) + 1);
            });
            chartData[chartId] = Array.from(counts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20)
              .map(([category, value]) => ({ category, value }));
          }
        }
      } else if (chart.type === "line") {
        const xCol = chart.xAxis;
        const yCol = chart.yAxis;
        if (xCol && yCol) {
          const grouped = new Map<string, number[]>();
          rows.forEach((r) => {
            const key = r[xCol] || "";
            const val = parseFloat(r[yCol]);
            if (!isNaN(val) && key) {
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(val);
            }
          });
          const agg = chart.aggregation || "avg";
          chartData[chartId] = Array.from(grouped.entries())
            .slice(0, 50)
            .map(([x, vals]) => {
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
          chartData[chartId] = rows
            .map((r) => ({ x: parseFloat(r[xCol]), y: parseFloat(r[yCol]) }))
            .filter((d) => !isNaN(d.x) && !isNaN(d.y))
            .slice(0, 200);
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
          const xValues = Array.from(new Set(rows.map((r) => r[xCol]))).slice(0, 15);
          const yValues = Array.from(new Set(rows.map((r) => r[yCol]))).slice(0, 15);
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
