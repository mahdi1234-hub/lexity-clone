// ─── Workflow Node Definitions ───────────────────────────────
// All CARTO-like geospatial workflow node types

export interface WorkflowNodeDef {
  id: string;
  label: string;
  category: string;
  icon: string; // SVG path data
  description: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  params: WorkflowNodeParam[];
}

export interface WorkflowNodeParam {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "column" | "sql" | "json" | "file";
  options?: { label: string; value: string }[];
  default?: string | number | boolean;
  required?: boolean;
  description?: string;
}

export const NODE_CATEGORIES = [
  { id: "input-output", label: "Input/Output", color: "#4A90D9" },
  { id: "data-preparation", label: "Data Preparation", color: "#5B9BD5" },
  { id: "aggregation", label: "Aggregation", color: "#357ABD" },
  { id: "joins", label: "Joins", color: "#2E75B6" },
  { id: "spatial-analysis", label: "Spatial Analysis", color: "#4472C4" },
  { id: "spatial-constructors", label: "Spatial Constructors", color: "#5B8BD5" },
  { id: "spatial-indexes", label: "Spatial Indexes", color: "#3D6BB5" },
  { id: "spatial-operations", label: "Spatial Operations", color: "#4A7DC4" },
  { id: "statistics", label: "Statistics", color: "#5A8BD5" },
  { id: "data-enrichment", label: "Data Enrichment", color: "#6B9BE5" },
  { id: "parsers", label: "Parsers", color: "#4A80C4" },
  { id: "control", label: "Control", color: "#7CB5EC" },
  { id: "custom", label: "Custom", color: "#91C7E8" },
  { id: "tileset-creation", label: "Tileset Creation", color: "#4A90D9" },
] as const;

// Icon path data for node types (simplified SVG paths)
const ICONS = {
  table: "M3 3h18v18H3V3zm0 6h18M3 15h18M9 9v12M15 9v12",
  import: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2h16v-2",
  export: "M12 21V9m0 0l4 4m-4-4l-4 4M4 5v2h16V5",
  filter: "M3 4h18l-7 8v5l-4 2V12L3 4z",
  transform: "M4 4l7 7m-7 0l7-7m2 3h7m-7 4h7m-7 4h5",
  map: "M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z",
  chart: "M3 3v18h18M7 16l4-8 4 4 5-10",
  geo: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
  grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z",
  merge: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  split: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  cluster: "M12 2a3 3 0 100 6 3 3 0 000-6zM5 16a3 3 0 100 6 3 3 0 000-6zm14 0a3 3 0 100 6 3 3 0 000-6zM12 8v4m-4.5 2.5L12 12m4.5 2.5L12 12",
  route: "M3 17l4-4 4 4 4-4 4 4M3 7l4 4 4-4 4 4 4-4",
  sql: "M4 7V4h16v3M9 20h6M12 4v16",
  ai: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  http: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  buffer: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 12m-7 0a7 7 0 1014 0 7 7 0 10-14 0",
  hex: "M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z",
  area: "M3 21V8l4-4h10l4 4v13H3zM3 8h18",
  distance: "M5 12h14M5 12l3-3m-3 3l3 3M19 12l-3-3m3 3l-3 3",
  envelope: "M3 8l9 6 9-6M3 8v10h18V8M3 8l9-4 9 4",
  process: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
};

export const WORKFLOW_NODES: WorkflowNodeDef[] = [
  // ─── Input/Output ────────────────────────────────────
  {
    id: "import-from-url", label: "Import from URL", category: "input-output", icon: ICONS.import,
    description: "Import data from a URL (CSV, GeoJSON, etc.)",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "url", label: "URL", type: "text", required: true, description: "URL to import data from" },
      { name: "format", label: "Format", type: "select", options: [{ label: "Auto-detect", value: "auto" }, { label: "CSV", value: "csv" }, { label: "GeoJSON", value: "geojson" }, { label: "JSON", value: "json" }], default: "auto" },
    ],
  },
  {
    id: "import-from-url-table", label: "Import from URL (Table)", category: "input-output", icon: ICONS.import,
    description: "Import tabular data from URL",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "url", label: "URL", type: "text", required: true },
      { name: "delimiter", label: "Delimiter", type: "text", default: "," },
    ],
  },
  {
    id: "get-table-by-name", label: "Get Table by Name", category: "input-output", icon: ICONS.table,
    description: "Load a table from BigQuery by name",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "tableName", label: "Table Name", type: "text", required: true, description: "BigQuery table name (project.dataset.table)" },
    ],
  },
  {
    id: "http-request", label: "HTTP Request", category: "input-output", icon: ICONS.http,
    description: "Make an HTTP request to an external API",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "url", label: "URL", type: "text", required: true },
      { name: "method", label: "Method", type: "select", options: [{ label: "GET", value: "GET" }, { label: "POST", value: "POST" }, { label: "PUT", value: "PUT" }], default: "GET" },
      { name: "headers", label: "Headers (JSON)", type: "json" },
      { name: "body", label: "Body (JSON)", type: "json" },
    ],
  },
  {
    id: "api-output", label: "API Output", category: "input-output", icon: ICONS.export,
    description: "Expose workflow output as an API endpoint",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [{ name: "name", label: "Endpoint Name", type: "text", required: true }],
  },
  {
    id: "save-as-table", label: "Save as Table", category: "input-output", icon: ICONS.save,
    description: "Save the result as a BigQuery table",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [
      { name: "tableName", label: "Table Name", type: "text", required: true },
      { name: "writeMode", label: "Write Mode", type: "select", options: [{ label: "Replace", value: "replace" }, { label: "Append", value: "append" }], default: "replace" },
    ],
  },
  {
    id: "export-to-bucket", label: "Export to Bucket", category: "input-output", icon: ICONS.export,
    description: "Export results to a cloud storage bucket",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [
      { name: "bucketPath", label: "Bucket Path", type: "text", required: true },
      { name: "format", label: "Format", type: "select", options: [{ label: "CSV", value: "csv" }, { label: "GeoJSON", value: "geojson" }, { label: "Parquet", value: "parquet" }], default: "csv" },
    ],
  },
  {
    id: "viewer-result", label: "Viewer Result", category: "input-output", icon: ICONS.map,
    description: "View results on a map",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [],
  },
  {
    id: "create-builder-map", label: "Create Builder Map", category: "input-output", icon: ICONS.map,
    description: "Create an interactive map visualization",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [
      { name: "mapType", label: "Map Type", type: "select", options: [{ label: "Points", value: "points" }, { label: "Heatmap", value: "heatmap" }, { label: "Hexagon", value: "hexagon" }, { label: "GeoJSON", value: "geojson" }], default: "points" },
    ],
  },
  {
    id: "send-by-email", label: "Send by Email", category: "input-output", icon: ICONS.envelope,
    description: "Send results via email",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [
      { name: "to", label: "Recipient Email", type: "text", required: true },
      { name: "subject", label: "Subject", type: "text", default: "Workflow Results" },
    ],
  },
  {
    id: "mcp-tool-output", label: "MCP Tool Output", category: "input-output", icon: ICONS.export,
    description: "Output for MCP tool integration",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [{ name: "toolName", label: "Tool Name", type: "text", required: true }],
  },

  // ─── Data Preparation ────────────────────────────────
  {
    id: "select", label: "Select", category: "data-preparation", icon: ICONS.filter,
    description: "Select specific columns from a table",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text", required: true, description: "Comma-separated column names" }],
  },
  {
    id: "where", label: "Where", category: "data-preparation", icon: ICONS.filter,
    description: "Filter rows based on a condition",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "condition", label: "Condition", type: "sql", required: true, description: "SQL WHERE condition" }],
  },
  {
    id: "order-by", label: "Order by", category: "data-preparation", icon: ICONS.transform,
    description: "Sort rows by column(s)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "direction", label: "Direction", type: "select", options: [{ label: "Ascending", value: "ASC" }, { label: "Descending", value: "DESC" }], default: "ASC" },
    ],
  },
  {
    id: "limit", label: "Limit", category: "data-preparation", icon: ICONS.filter,
    description: "Limit number of rows",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "limit", label: "Row Limit", type: "number", default: 100, required: true }],
  },
  {
    id: "create-column", label: "Create Column", category: "data-preparation", icon: ICONS.transform,
    description: "Create a new column using an expression",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "columnName", label: "Column Name", type: "text", required: true },
      { name: "expression", label: "Expression", type: "sql", required: true },
    ],
  },
  {
    id: "rename-column", label: "Rename Column", category: "data-preparation", icon: ICONS.transform,
    description: "Rename a column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "oldName", label: "Current Name", type: "column", required: true },
      { name: "newName", label: "New Name", type: "text", required: true },
    ],
  },
  {
    id: "drop-columns", label: "Drop Columns", category: "data-preparation", icon: ICONS.transform,
    description: "Remove columns from a table",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns to Drop", type: "text", required: true }],
  },
  {
    id: "cast", label: "Cast", category: "data-preparation", icon: ICONS.transform,
    description: "Change column data type",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "targetType", label: "Target Type", type: "select", options: [{ label: "STRING", value: "STRING" }, { label: "INT64", value: "INT64" }, { label: "FLOAT64", value: "FLOAT64" }, { label: "BOOL", value: "BOOL" }, { label: "TIMESTAMP", value: "TIMESTAMP" }, { label: "GEOGRAPHY", value: "GEOGRAPHY" }] },
    ],
  },
  {
    id: "case-when", label: "Case When", category: "data-preparation", icon: ICONS.transform,
    description: "Conditional column creation with CASE WHEN",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "columnName", label: "New Column Name", type: "text", required: true },
      { name: "expression", label: "CASE Expression", type: "sql", required: true },
    ],
  },
  {
    id: "simple-filter", label: "Simple Filter", category: "data-preparation", icon: ICONS.filter,
    description: "Filter with a simple UI-based condition",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "operator", label: "Operator", type: "select", options: [{ label: "=", value: "eq" }, { label: "!=", value: "neq" }, { label: ">", value: "gt" }, { label: "<", value: "lt" }, { label: ">=", value: "gte" }, { label: "<=", value: "lte" }, { label: "LIKE", value: "like" }, { label: "IN", value: "in" }, { label: "IS NULL", value: "null" }, { label: "IS NOT NULL", value: "notnull" }] },
      { name: "value", label: "Value", type: "text" },
    ],
  },
  {
    id: "spatial-filter", label: "Spatial Filter", category: "data-preparation", icon: ICONS.geo,
    description: "Filter by spatial relationship",
    inputs: [{ name: "input", type: "table" }, { name: "filter", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "relationship", label: "Relationship", type: "select", options: [{ label: "Intersects", value: "intersects" }, { label: "Contains", value: "contains" }, { label: "Within", value: "within" }], default: "intersects" },
    ],
  },
  {
    id: "sample", label: "Sample", category: "data-preparation", icon: ICONS.filter,
    description: "Random sample of rows",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "sampleSize", label: "Sample Size", type: "number", default: 1000 },
      { name: "sampleType", label: "Type", type: "select", options: [{ label: "Rows", value: "rows" }, { label: "Percentage", value: "percent" }], default: "rows" },
    ],
  },
  {
    id: "unique", label: "Unique", category: "data-preparation", icon: ICONS.filter,
    description: "Remove duplicate rows",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns (blank = all)", type: "text" }],
  },
  {
    id: "select-distinct", label: "Select Distinct", category: "data-preparation", icon: ICONS.filter,
    description: "Select distinct values",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text", required: true }],
  },
  {
    id: "normalize", label: "Normalize", category: "data-preparation", icon: ICONS.transform,
    description: "Normalize numeric column values",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "method", label: "Method", type: "select", options: [{ label: "Min-Max", value: "minmax" }, { label: "Z-Score", value: "zscore" }], default: "minmax" },
    ],
  },
  {
    id: "find-and-replace", label: "Find and Replace", category: "data-preparation", icon: ICONS.transform,
    description: "Find and replace values in a column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "find", label: "Find", type: "text", required: true },
      { name: "replace", label: "Replace With", type: "text", required: true },
    ],
  },
  {
    id: "remove-duplicated", label: "Remove Duplicated", category: "data-preparation", icon: ICONS.filter,
    description: "Remove duplicate rows based on columns",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text" }],
  },
  {
    id: "row-number", label: "Row Number", category: "data-preparation", icon: ICONS.transform,
    description: "Add row number column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "columnName", label: "Column Name", type: "text", default: "row_num" },
      { name: "orderBy", label: "Order By", type: "column" },
    ],
  },
  {
    id: "generate-uuid", label: "Generate UUID", category: "data-preparation", icon: ICONS.transform,
    description: "Add a UUID column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columnName", label: "Column Name", type: "text", default: "uuid" }],
  },
  {
    id: "is-not-null", label: "Is not Null", category: "data-preparation", icon: ICONS.filter,
    description: "Filter rows where column is not null",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "column", label: "Column", type: "column", required: true }],
  },
  {
    id: "edit-schema", label: "Edit Schema", category: "data-preparation", icon: ICONS.transform,
    description: "Edit table schema (rename, reorder, cast columns)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "schema", label: "Schema Definition", type: "json" }],
  },
  {
    id: "parse-json", label: "Parse JSON", category: "data-preparation", icon: ICONS.transform,
    description: "Parse JSON column into structured data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "JSON Column", type: "column", required: true },
      { name: "fields", label: "Fields to Extract", type: "text" },
    ],
  },
  {
    id: "extract-from-json", label: "Extract from JSON", category: "data-preparation", icon: ICONS.transform,
    description: "Extract fields from a JSON column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "JSON Column", type: "column", required: true },
      { name: "path", label: "JSON Path", type: "text", required: true },
      { name: "outputColumn", label: "Output Column", type: "text", required: true },
    ],
  },
  {
    id: "columns-to-array", label: "Columns to Array", category: "data-preparation", icon: ICONS.transform,
    description: "Combine columns into an array column",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "columns", label: "Columns", type: "text", required: true },
      { name: "outputColumn", label: "Output Column", type: "text", default: "array_col" },
    ],
  },
  {
    id: "text-to-columns", label: "Text to Columns", category: "data-preparation", icon: ICONS.transform,
    description: "Split a text column into multiple columns",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Column", type: "column", required: true },
      { name: "delimiter", label: "Delimiter", type: "text", default: "," },
    ],
  },
  {
    id: "transpose-unpivot", label: "Transpose / Unpivot", category: "data-preparation", icon: ICONS.transform,
    description: "Transpose or unpivot table data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "mode", label: "Mode", type: "select", options: [{ label: "Transpose", value: "transpose" }, { label: "Unpivot", value: "unpivot" }], default: "unpivot" },
      { name: "columns", label: "Columns", type: "text" },
    ],
  },
  {
    id: "multi-col-formula", label: "Multi-col Formula", category: "data-preparation", icon: ICONS.transform,
    description: "Apply a formula across multiple columns",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "columns", label: "Columns", type: "text", required: true },
      { name: "formula", label: "Formula", type: "sql", required: true },
    ],
  },
  {
    id: "multi-row-formula", label: "Multi-row Formula", category: "data-preparation", icon: ICONS.transform,
    description: "Apply a formula across rows (window function)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "expression", label: "Expression", type: "sql", required: true },
      { name: "partitionBy", label: "Partition By", type: "column" },
      { name: "orderBy", label: "Order By", type: "column" },
    ],
  },
  {
    id: "hex-color-generator", label: "Hex Color Generator", category: "data-preparation", icon: ICONS.transform,
    description: "Generate hex color values from data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "column", label: "Value Column", type: "column", required: true },
      { name: "palette", label: "Palette", type: "select", options: [{ label: "Viridis", value: "viridis" }, { label: "Plasma", value: "plasma" }, { label: "Inferno", value: "inferno" }, { label: "Spectral", value: "spectral" }], default: "viridis" },
    ],
  },
  {
    id: "poly-build", label: "Poly Build", category: "data-preparation", icon: ICONS.geo,
    description: "Build polygons from points",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "groupBy", label: "Group By", type: "column" }],
  },
  {
    id: "poly-split", label: "Poly Split", category: "data-preparation", icon: ICONS.split,
    description: "Split polygons into components",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },

  // ─── Aggregation ─────────────────────────────────────
  {
    id: "count", label: "Count", category: "aggregation", icon: ICONS.chart,
    description: "Count rows, optionally grouped",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "groupBy", label: "Group By", type: "column" }],
  },
  {
    id: "group-by", label: "Group by", category: "aggregation", icon: ICONS.grid,
    description: "Group and aggregate data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "groupColumns", label: "Group Columns", type: "text", required: true },
      { name: "aggregations", label: "Aggregations (JSON)", type: "json", required: true, description: '[{"column":"col","function":"SUM|AVG|COUNT|MIN|MAX"}]' },
    ],
  },
  {
    id: "summarize", label: "Summarize", category: "aggregation", icon: ICONS.chart,
    description: "Compute summary statistics",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text" }],
  },
  {
    id: "point-stats-in-polygons", label: "Point Stats in Polygons", category: "aggregation", icon: ICONS.geo,
    description: "Aggregate point statistics within polygons",
    inputs: [{ name: "points", type: "table" }, { name: "polygons", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column" },
      { name: "function", label: "Function", type: "select", options: [{ label: "COUNT", value: "count" }, { label: "SUM", value: "sum" }, { label: "AVG", value: "avg" }], default: "count" },
    ],
  },
  {
    id: "st-dump", label: "ST Dump", category: "aggregation", icon: ICONS.geo,
    description: "Decompose multi-geometries into single geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "unnest", label: "Unnest", category: "aggregation", icon: ICONS.transform,
    description: "Unnest array columns into rows",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "column", label: "Array Column", type: "column", required: true }],
  },

  // ─── Joins ───────────────────────────────────────────
  {
    id: "join", label: "Join", category: "joins", icon: ICONS.merge,
    description: "Join two tables on a key",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "leftKey", label: "Left Key", type: "column", required: true },
      { name: "rightKey", label: "Right Key", type: "column", required: true },
      { name: "joinType", label: "Join Type", type: "select", options: [{ label: "Inner", value: "INNER" }, { label: "Left", value: "LEFT" }, { label: "Right", value: "RIGHT" }, { label: "Full", value: "FULL" }], default: "INNER" },
    ],
  },
  {
    id: "cross-join", label: "Cross Join", category: "joins", icon: ICONS.merge,
    description: "Cross join (cartesian product) two tables",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "spatial-join", label: "Spatial Join", category: "joins", icon: ICONS.geo,
    description: "Join tables based on spatial relationship",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "relationship", label: "Relationship", type: "select", options: [{ label: "Intersects", value: "intersects" }, { label: "Contains", value: "contains" }, { label: "Within", value: "within" }, { label: "Nearest", value: "nearest" }], default: "intersects" },
    ],
  },
  {
    id: "join-extended", label: "Join (Extended)", category: "joins", icon: ICONS.merge,
    description: "Advanced join with multiple conditions",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "conditions", label: "Join Conditions (SQL)", type: "sql", required: true },
      { name: "joinType", label: "Join Type", type: "select", options: [{ label: "Inner", value: "INNER" }, { label: "Left", value: "LEFT" }, { label: "Right", value: "RIGHT" }, { label: "Full", value: "FULL" }], default: "INNER" },
    ],
  },
  {
    id: "spatial-match", label: "Spatial Match", category: "joins", icon: ICONS.geo,
    description: "Match nearest spatial features",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "maxDistance", label: "Max Distance (m)", type: "number", default: 1000 }],
  },
  {
    id: "union-all", label: "Union All", category: "joins", icon: ICONS.merge,
    description: "Union (stack) two tables",
    inputs: [{ name: "top", type: "table" }, { name: "bottom", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-difference", label: "ST Difference", category: "joins", icon: ICONS.geo,
    description: "Compute spatial difference between geometries",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-intersection", label: "ST Intersection", category: "joins", icon: ICONS.geo,
    description: "Compute spatial intersection of geometries",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },

  // ─── Spatial Analysis ────────────────────────────────
  {
    id: "k-nearest-neighbors", label: "K-Nearest Neighbors", category: "spatial-analysis", icon: ICONS.cluster,
    description: "Find K nearest spatial neighbors",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "k", label: "K (neighbors)", type: "number", default: 5 }],
  },
  {
    id: "st-cluster-dbscan", label: "ST Cluster DBSCAN", category: "spatial-analysis", icon: ICONS.cluster,
    description: "Spatial DBSCAN clustering",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "epsilon", label: "Epsilon (m)", type: "number", default: 500 },
      { name: "minPoints", label: "Min Points", type: "number", default: 5 },
    ],
  },
  {
    id: "st-cluster-kmeans", label: "ST Cluster K-Means", category: "spatial-analysis", icon: ICONS.cluster,
    description: "Spatial K-Means clustering",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "k", label: "Number of Clusters", type: "number", default: 5, required: true }],
  },
  {
    id: "st-count-points-in-polygons", label: "ST Count Points in Polygons", category: "spatial-analysis", icon: ICONS.geo,
    description: "Count points within polygons",
    inputs: [{ name: "points", type: "table" }, { name: "polygons", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-delaunay-polygons", label: "ST Delaunay Polygons", category: "spatial-analysis", icon: ICONS.geo,
    description: "Generate Delaunay triangulation",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-voronoi", label: "ST Voronoi", category: "spatial-analysis", icon: ICONS.geo,
    description: "Generate Voronoi polygons",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },

  // ─── Spatial Constructors ────────────────────────────
  {
    id: "st-geocode", label: "ST Geocode", category: "spatial-constructors", icon: ICONS.geo,
    description: "Geocode addresses to coordinates",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "addressColumn", label: "Address Column", type: "column", required: true }],
  },
  {
    id: "point-from-latlon", label: "Point from LatLon", category: "spatial-constructors", icon: ICONS.geo,
    description: "Create point geometry from lat/lon columns",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "latColumn", label: "Latitude Column", type: "column", required: true },
      { name: "lonColumn", label: "Longitude Column", type: "column", required: true },
    ],
  },
  {
    id: "create-grid", label: "Create Grid", category: "spatial-constructors", icon: ICONS.grid,
    description: "Create a spatial grid over an area",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "cellSize", label: "Cell Size (m)", type: "number", default: 1000 },
      { name: "gridType", label: "Grid Type", type: "select", options: [{ label: "Square", value: "square" }, { label: "Hexagonal", value: "hex" }], default: "square" },
    ],
  },
  {
    id: "create-h3-isolines", label: "Create H3 Isolines", category: "spatial-constructors", icon: ICONS.hex,
    description: "Create H3-based isolines",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "resolution", label: "H3 Resolution", type: "number", default: 7 }],
  },
  {
    id: "create-isolines", label: "Create Isolines", category: "spatial-constructors", icon: ICONS.route,
    description: "Create isochrone/isodistance polygons",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "mode", label: "Mode", type: "select", options: [{ label: "Driving", value: "driving" }, { label: "Walking", value: "walking" }, { label: "Cycling", value: "cycling" }], default: "driving" },
      { name: "ranges", label: "Ranges (minutes)", type: "text", default: "5,10,15" },
    ],
  },
  {
    id: "create-routes", label: "Create Routes", category: "spatial-constructors", icon: ICONS.route,
    description: "Create routes between origin-destination pairs",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "originLat", label: "Origin Lat Column", type: "column", required: true },
      { name: "originLon", label: "Origin Lon Column", type: "column", required: true },
      { name: "destLat", label: "Dest Lat Column", type: "column", required: true },
      { name: "destLon", label: "Dest Lon Column", type: "column", required: true },
    ],
  },
  {
    id: "st-make-line", label: "ST Make Line", category: "spatial-constructors", icon: ICONS.route,
    description: "Create lines from ordered points",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "orderBy", label: "Order Column", type: "column" }],
  },
  {
    id: "st-make-polygon", label: "ST Make Polygon", category: "spatial-constructors", icon: ICONS.geo,
    description: "Create polygons from linestrings",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "clip-with-polygons", label: "Clip with Polygons", category: "spatial-constructors", icon: ICONS.geo,
    description: "Clip geometries using polygon boundaries",
    inputs: [{ name: "input", type: "table" }, { name: "clip", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "bbox-from-values", label: "BBOX from Values", category: "spatial-constructors", icon: ICONS.area,
    description: "Create bounding box from coordinate values",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "minLon", label: "Min Longitude", type: "number", required: true },
      { name: "minLat", label: "Min Latitude", type: "number", required: true },
      { name: "maxLon", label: "Max Longitude", type: "number", required: true },
      { name: "maxLat", label: "Max Latitude", type: "number", required: true },
    ],
  },
  {
    id: "create-routing-matrix", label: "Create Routing Matrix", category: "spatial-constructors", icon: ICONS.route,
    description: "Create a distance/time matrix between points",
    inputs: [{ name: "origins", type: "table" }, { name: "destinations", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "mode", label: "Mode", type: "select", options: [{ label: "Driving", value: "driving" }, { label: "Walking", value: "walking" }], default: "driving" }],
  },
  {
    id: "st-boundary", label: "ST Boundary", category: "spatial-constructors", icon: ICONS.geo,
    description: "Get boundary of geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-bounding-box", label: "ST Bounding Box", category: "spatial-constructors", icon: ICONS.area,
    description: "Get bounding box of geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-extent", label: "ST Extent", category: "spatial-constructors", icon: ICONS.area,
    description: "Get spatial extent of all geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "remove-holes", label: "Remove Holes", category: "spatial-constructors", icon: ICONS.geo,
    description: "Remove holes from polygons",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "minArea", label: "Min Hole Area (sq m)", type: "number", default: 0 }],
  },
  {
    id: "spatial-process", label: "Spatial Process", category: "spatial-constructors", icon: ICONS.process,
    description: "Apply spatial processing operations",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "operation", label: "Operation", type: "select", options: [{ label: "Dissolve", value: "dissolve" }, { label: "Explode", value: "explode" }, { label: "Union", value: "union" }] }],
  },
  {
    id: "st-generate-points", label: "ST Generate Points", category: "spatial-constructors", icon: ICONS.geo,
    description: "Generate random points within polygons",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "numPoints", label: "Number of Points", type: "number", default: 100 }],
  },
  {
    id: "st-polygonize", label: "ST Polygonize", category: "spatial-constructors", icon: ICONS.geo,
    description: "Create polygons from lines",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },

  // ─── Spatial Indexes ─────────────────────────────────
  {
    id: "h3-boundary", label: "H3 Boundary", category: "spatial-indexes", icon: ICONS.hex,
    description: "Get boundary polygon of H3 cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "h3Column", label: "H3 Column", type: "column", required: true }],
  },
  {
    id: "h3-center", label: "H3 Center", category: "spatial-indexes", icon: ICONS.hex,
    description: "Get center point of H3 cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "h3Column", label: "H3 Column", type: "column", required: true }],
  },
  {
    id: "h3-from-geopoint", label: "H3 from GeoPoint", category: "spatial-indexes", icon: ICONS.hex,
    description: "Convert points to H3 indexes",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "resolution", label: "Resolution (0-15)", type: "number", default: 7, required: true }],
  },
  {
    id: "h3-polyfill", label: "H3 Polyfill", category: "spatial-indexes", icon: ICONS.hex,
    description: "Fill polygons with H3 cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "resolution", label: "Resolution (0-15)", type: "number", default: 7 }],
  },
  {
    id: "h3-kring", label: "H3 KRing", category: "spatial-indexes", icon: ICONS.hex,
    description: "Get K-ring neighbors of H3 cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "h3Column", label: "H3 Column", type: "column", required: true },
      { name: "k", label: "K (ring size)", type: "number", default: 1 },
    ],
  },
  {
    id: "h3-grid-distance", label: "H3 Grid Distance", category: "spatial-indexes", icon: ICONS.hex,
    description: "Calculate grid distance between H3 cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "h3Column1", label: "H3 Column 1", type: "column", required: true },
      { name: "h3Column2", label: "H3 Column 2", type: "column", required: true },
    ],
  },
  {
    id: "h3-to-parent", label: "H3 To Parent", category: "spatial-indexes", icon: ICONS.hex,
    description: "Get parent H3 cell at lower resolution",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "h3Column", label: "H3 Column", type: "column", required: true },
      { name: "parentResolution", label: "Parent Resolution", type: "number", required: true },
    ],
  },
  {
    id: "quadbin-boundary", label: "Quadbin Boundary", category: "spatial-indexes", icon: ICONS.grid,
    description: "Get boundary of Quadbin cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "quadbinColumn", label: "Quadbin Column", type: "column", required: true }],
  },
  {
    id: "quadbin-center", label: "Quadbin Center", category: "spatial-indexes", icon: ICONS.grid,
    description: "Get center point of Quadbin cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "quadbinColumn", label: "Quadbin Column", type: "column", required: true }],
  },
  {
    id: "quadbin-from-geopoint", label: "Quadbin from GeoPoint", category: "spatial-indexes", icon: ICONS.grid,
    description: "Convert points to Quadbin indexes",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "resolution", label: "Resolution", type: "number", default: 15 }],
  },
  {
    id: "quadbin-kring", label: "Quadbin KRing", category: "spatial-indexes", icon: ICONS.grid,
    description: "Get K-ring neighbors of Quadbin cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "quadbinColumn", label: "Quadbin Column", type: "column", required: true },
      { name: "k", label: "K", type: "number", default: 1 },
    ],
  },
  {
    id: "quadbin-polyfill", label: "Quadbin Polyfill", category: "spatial-indexes", icon: ICONS.grid,
    description: "Fill polygons with Quadbin cells",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "resolution", label: "Resolution", type: "number", default: 15 }],
  },
  {
    id: "quadbin-to-parent", label: "Quadbin To Parent", category: "spatial-indexes", icon: ICONS.grid,
    description: "Get parent Quadbin at lower resolution",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "quadbinColumn", label: "Quadbin Column", type: "column", required: true },
      { name: "parentResolution", label: "Parent Resolution", type: "number", required: true },
    ],
  },

  // ─── Spatial Operations ──────────────────────────────
  {
    id: "st-area", label: "ST Area", category: "spatial-operations", icon: ICONS.area,
    description: "Calculate area of geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "unit", label: "Unit", type: "select", options: [{ label: "Square Meters", value: "sqm" }, { label: "Square Kilometers", value: "sqkm" }, { label: "Hectares", value: "ha" }], default: "sqm" }],
  },
  {
    id: "st-buffer", label: "ST Buffer", category: "spatial-operations", icon: ICONS.buffer,
    description: "Create buffer around geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "distance", label: "Distance (m)", type: "number", default: 100, required: true }],
  },
  {
    id: "st-centroid", label: "ST Centroid", category: "spatial-operations", icon: ICONS.geo,
    description: "Get centroid of geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-convex-hull", label: "ST Convex Hull", category: "spatial-operations", icon: ICONS.geo,
    description: "Compute convex hull",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-concave-hull", label: "ST Concave Hull", category: "spatial-operations", icon: ICONS.geo,
    description: "Compute concave hull",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "ratio", label: "Ratio", type: "number", default: 0.3 }],
  },
  {
    id: "st-distance", label: "ST Distance", category: "spatial-operations", icon: ICONS.distance,
    description: "Calculate distance between geometries",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "unit", label: "Unit", type: "select", options: [{ label: "Meters", value: "m" }, { label: "Kilometers", value: "km" }, { label: "Miles", value: "mi" }], default: "m" }],
  },
  {
    id: "distance-single-table", label: "Distance (single table)", category: "spatial-operations", icon: ICONS.distance,
    description: "Calculate distances within a single table",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "geoColumn1", label: "Geometry Column 1", type: "column", required: true },
      { name: "geoColumn2", label: "Geometry Column 2", type: "column", required: true },
    ],
  },
  {
    id: "distance-matrix", label: "Distance Matrix", category: "spatial-operations", icon: ICONS.distance,
    description: "Calculate pairwise distance matrix",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "maxDistance", label: "Max Distance (m)", type: "number" }],
  },
  {
    id: "distance-to-nearest", label: "Distance to Nearest", category: "spatial-operations", icon: ICONS.distance,
    description: "Find distance to nearest feature",
    inputs: [{ name: "source", type: "table" }, { name: "target", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "maxDistance", label: "Max Distance (m)", type: "number", default: 10000 }],
  },
  {
    id: "spatial-info", label: "Spatial Info", category: "spatial-operations", icon: ICONS.geo,
    description: "Get spatial metadata (type, SRID, dimensions)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-simplify", label: "ST Simplify", category: "spatial-operations", icon: ICONS.geo,
    description: "Simplify geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "tolerance", label: "Tolerance (m)", type: "number", default: 10 }],
  },
  {
    id: "st-snap-to-grid", label: "ST Snap to Grid", category: "spatial-operations", icon: ICONS.grid,
    description: "Snap coordinates to a grid",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "size", label: "Grid Size", type: "number", default: 0.001 }],
  },
  {
    id: "st-length", label: "ST Length", category: "spatial-operations", icon: ICONS.distance,
    description: "Calculate length of linestring geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "unit", label: "Unit", type: "select", options: [{ label: "Meters", value: "m" }, { label: "Kilometers", value: "km" }], default: "m" }],
  },
  {
    id: "st-perimeter", label: "ST Perimeter", category: "spatial-operations", icon: ICONS.distance,
    description: "Calculate perimeter of polygons",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-dwithin", label: "ST DWithin", category: "spatial-operations", icon: ICONS.buffer,
    description: "Test if geometries are within a distance",
    inputs: [{ name: "left", type: "table" }, { name: "right", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "distance", label: "Distance (m)", type: "number", default: 100, required: true }],
  },
  {
    id: "st-line-interpolate-point", label: "ST Line Interpolate Point", category: "spatial-operations", icon: ICONS.route,
    description: "Interpolate point along a line",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "fraction", label: "Fraction (0-1)", type: "number", default: 0.5 }],
  },
  {
    id: "subdivide", label: "Subdivide", category: "spatial-operations", icon: ICONS.split,
    description: "Subdivide large geometries",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "maxVertices", label: "Max Vertices", type: "number", default: 256 }],
  },
  {
    id: "trade-areas", label: "Trade Areas", category: "spatial-operations", icon: ICONS.area,
    description: "Generate trade/catchment areas",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "mode", label: "Mode", type: "select", options: [{ label: "Drive time", value: "drive" }, { label: "Walk time", value: "walk" }, { label: "Distance", value: "distance" }], default: "drive" },
      { name: "ranges", label: "Ranges", type: "text", default: "5,10,15" },
    ],
  },

  // ─── Statistics ──────────────────────────────────────
  {
    id: "hotspot-analysis", label: "Hotspot Analysis", category: "statistics", icon: ICONS.chart,
    description: "Getis-Ord Gi* hotspot analysis",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column", required: true },
      { name: "bandwidth", label: "Bandwidth (m)", type: "number", default: 1000 },
    ],
  },
  {
    id: "morans-i", label: "Morans I", category: "statistics", icon: ICONS.chart,
    description: "Spatial autocorrelation (Moran's I)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "valueColumn", label: "Value Column", type: "column", required: true }],
  },
  {
    id: "local-morans-i", label: "Local Morans I", category: "statistics", icon: ICONS.chart,
    description: "Local spatial autocorrelation (LISA)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "valueColumn", label: "Value Column", type: "column", required: true }],
  },
  {
    id: "getis-ord", label: "Getis Ord", category: "statistics", icon: ICONS.chart,
    description: "Getis-Ord General G statistic",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "valueColumn", label: "Value Column", type: "column", required: true }],
  },
  {
    id: "getis-ord-spacetime", label: "Getis Ord Spacetime", category: "statistics", icon: ICONS.chart,
    description: "Space-time Getis-Ord analysis",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column", required: true },
      { name: "timeColumn", label: "Time Column", type: "column", required: true },
    ],
  },
  {
    id: "gwr", label: "GWR", category: "statistics", icon: ICONS.chart,
    description: "Geographically Weighted Regression",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "dependentVar", label: "Dependent Variable", type: "column", required: true },
      { name: "independentVars", label: "Independent Variables", type: "text", required: true },
    ],
  },
  {
    id: "detect-space-time-anomalies", label: "Detect Space-time Anomalies", category: "statistics", icon: ICONS.chart,
    description: "Detect anomalies in space-time data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column", required: true },
      { name: "timeColumn", label: "Time Column", type: "column", required: true },
    ],
  },
  {
    id: "detect-spatial-anomalies", label: "Detect Spatial Anomalies", category: "statistics", icon: ICONS.chart,
    description: "Detect spatial outliers",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "valueColumn", label: "Value Column", type: "column", required: true }],
  },
  {
    id: "cluster-time-series", label: "Cluster Time Series", category: "statistics", icon: ICONS.cluster,
    description: "Cluster spatial time series data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column", required: true },
      { name: "timeColumn", label: "Time Column", type: "column", required: true },
      { name: "k", label: "Clusters", type: "number", default: 5 },
    ],
  },
  {
    id: "composite-score-supervised", label: "Composite Score Supervised", category: "statistics", icon: ICONS.chart,
    description: "Supervised composite score calculation",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "targetColumn", label: "Target Column", type: "column", required: true },
      { name: "featureColumns", label: "Feature Columns", type: "text", required: true },
    ],
  },
  {
    id: "composite-score-unsupervised", label: "Composite Score Unsupervised", category: "statistics", icon: ICONS.chart,
    description: "Unsupervised composite score (PCA-based)",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text", required: true }],
  },
  {
    id: "cronbach-alpha", label: "Cronbach Alpha Coefficient", category: "statistics", icon: ICONS.chart,
    description: "Calculate Cronbach's alpha reliability",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "columns", label: "Columns", type: "text", required: true }],
  },
  {
    id: "spacetime-hotspots", label: "Spacetime Hotspots Classification", category: "statistics", icon: ICONS.chart,
    description: "Classify spacetime hotspots",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "valueColumn", label: "Value Column", type: "column", required: true },
      { name: "timeColumn", label: "Time Column", type: "column", required: true },
    ],
  },

  // ─── Data Enrichment ─────────────────────────────────
  {
    id: "downscaling", label: "Downscaling", category: "data-enrichment", icon: ICONS.transform,
    description: "Downscale aggregated data to finer resolution",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "targetResolution", label: "Target Resolution", type: "number", default: 9 }],
  },
  {
    id: "enrich-h3-grid", label: "Enrich H3 Grid", category: "data-enrichment", icon: ICONS.hex,
    description: "Enrich H3 grid with external data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "dataset", label: "Enrichment Dataset", type: "text", required: true }],
  },
  {
    id: "enrich-points", label: "Enrich Points", category: "data-enrichment", icon: ICONS.geo,
    description: "Enrich point data with nearby features",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "dataset", label: "Enrichment Dataset", type: "text", required: true },
      { name: "radius", label: "Radius (m)", type: "number", default: 500 },
    ],
  },
  {
    id: "enrich-polygons", label: "Enrich Polygons", category: "data-enrichment", icon: ICONS.geo,
    description: "Enrich polygons with overlapping data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "dataset", label: "Enrichment Dataset", type: "text", required: true }],
  },
  {
    id: "enrich-polygons-weights", label: "Enrich Polygons with Weights", category: "data-enrichment", icon: ICONS.geo,
    description: "Enrich polygons using area-weighted method",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "dataset", label: "Enrichment Dataset", type: "text", required: true },
      { name: "weightColumn", label: "Weight Column", type: "column" },
    ],
  },
  {
    id: "enrich-quadbin-grid", label: "Enrich Quadbin Grid", category: "data-enrichment", icon: ICONS.grid,
    description: "Enrich Quadbin grid with external data",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "dataset", label: "Enrichment Dataset", type: "text", required: true }],
  },

  // ─── Parsers ─────────────────────────────────────────
  {
    id: "draw-custom-features", label: "Draw Custom Features", category: "parsers", icon: ICONS.geo,
    description: "Draw custom geometries on the map",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "geojson", label: "GeoJSON", type: "json" }],
  },
  {
    id: "st-as-geojson", label: "ST as GeoJSON", category: "parsers", icon: ICONS.geo,
    description: "Convert geometry to GeoJSON string",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-as-text", label: "ST as Text", category: "parsers", icon: ICONS.geo,
    description: "Convert geometry to WKT text",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [],
  },
  {
    id: "st-geog-from-text", label: "ST Geog from Text", category: "parsers", icon: ICONS.geo,
    description: "Create geography from WKT text",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "column", label: "WKT Column", type: "column", required: true }],
  },
  {
    id: "st-geopoint", label: "ST GeoPoint", category: "parsers", icon: ICONS.geo,
    description: "Create point from lat/lon",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "latColumn", label: "Latitude Column", type: "column", required: true },
      { name: "lonColumn", label: "Longitude Column", type: "column", required: true },
    ],
  },
  {
    id: "table-from-geojson", label: "Table from GeoJSON", category: "parsers", icon: ICONS.table,
    description: "Create table from GeoJSON",
    inputs: [], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "geojson", label: "GeoJSON", type: "json", required: true }],
  },

  // ─── Control ─────────────────────────────────────────
  {
    id: "conditional-split", label: "Conditional Split", category: "control", icon: ICONS.split,
    description: "Split flow based on condition",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "true", type: "table" }, { name: "false", type: "table" }],
    params: [{ name: "condition", label: "Condition", type: "sql", required: true }],
  },
  {
    id: "success-error-split", label: "Success/Error Split", category: "control", icon: ICONS.split,
    description: "Split flow on success or error",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "success", type: "table" }, { name: "error", type: "table" }],
    params: [],
  },

  // ─── Custom ──────────────────────────────────────────
  {
    id: "call-procedure", label: "Call Procedure", category: "custom", icon: ICONS.sql,
    description: "Call a stored procedure or UDF",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [
      { name: "procedure", label: "Procedure Name", type: "text", required: true },
      { name: "params", label: "Parameters (JSON)", type: "json" },
    ],
  },
  {
    id: "custom-sql-select", label: "Custom SQL Select", category: "custom", icon: ICONS.sql,
    description: "Write custom SQL query",
    inputs: [{ name: "input", type: "table" }], outputs: [{ name: "output", type: "table" }],
    params: [{ name: "sql", label: "SQL Query", type: "sql", required: true, description: "Use {{input}} to reference the input table" }],
  },

  // ─── Tileset Creation ────────────────────────────────
  {
    id: "create-h3-agg-tileset", label: "Create H3 Agg Tileset", category: "tileset-creation", icon: ICONS.hex,
    description: "Create H3 aggregation tileset",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [
      { name: "tilesetName", label: "Tileset Name", type: "text", required: true },
      { name: "resolution", label: "Resolution", type: "number", default: 7 },
    ],
  },
  {
    id: "create-point-agg-tileset", label: "Create Point Agg Tileset", category: "tileset-creation", icon: ICONS.geo,
    description: "Create point aggregation tileset",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [{ name: "tilesetName", label: "Tileset Name", type: "text", required: true }],
  },
  {
    id: "create-quadbin-agg-tileset", label: "Create Quadbin Agg Tileset", category: "tileset-creation", icon: ICONS.grid,
    description: "Create Quadbin aggregation tileset",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [{ name: "tilesetName", label: "Tileset Name", type: "text", required: true }],
  },
  {
    id: "create-vector-tileset", label: "Create Vector Tileset", category: "tileset-creation", icon: ICONS.map,
    description: "Create vector tileset for map display",
    inputs: [{ name: "input", type: "table" }], outputs: [],
    params: [{ name: "tilesetName", label: "Tileset Name", type: "text", required: true }],
  },
];

// Helper to get nodes by category
export function getNodesByCategory(category: string): WorkflowNodeDef[] {
  return WORKFLOW_NODES.filter((n) => n.category === category);
}

// Helper to get category color
export function getCategoryColor(category: string): string {
  return NODE_CATEGORIES.find((c) => c.id === category)?.color || "#4A90D9";
}

// Helper to get node definition by ID
export function getNodeDef(id: string): WorkflowNodeDef | undefined {
  return WORKFLOW_NODES.find((n) => n.id === id);
}
