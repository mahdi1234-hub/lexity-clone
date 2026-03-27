import mammoth from "mammoth";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export type FileType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "json"
  | "xml"
  | "markdown"
  | "yaml"
  | "tsv"
  | "html"
  | "image"
  | "video"
  | "text"
  | "parquet"
  | "unknown";

export function detectFileType(filename: string, mimeType: string): FileType {
  const ext = filename.toLowerCase().split(".").pop() || "";

  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (
    ext === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (ext === "doc" || mimeType === "application/msword") return "docx";
  if (
    ext === "xlsx" ||
    ext === "xls" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  )
    return "xlsx";
  if (ext === "csv" || mimeType === "text/csv") return "csv";
  if (ext === "tsv" || mimeType === "text/tab-separated-values") return "tsv";
  if (ext === "json" || mimeType === "application/json") return "json";
  if (ext === "xml" || mimeType === "application/xml" || mimeType === "text/xml") return "xml";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "yaml" || ext === "yml" || mimeType === "application/x-yaml") return "yaml";
  if (ext === "html" || ext === "htm" || mimeType === "text/html") return "html";
  if (ext === "parquet") return "parquet";
  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)
  )
    return "image";
  if (
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "avi", "mov", "mkv"].includes(ext)
  )
    return "video";
  if (
    mimeType.startsWith("text/") ||
    ["txt", "log", "css", "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "h", "rb", "go", "rs", "sql", "ini", "cfg", "toml", "env", "sh", "bat", "ps1", "r", "scala", "swift", "kt", "dart", "php", "lua", "pl", "m"].includes(ext)
  )
    return "text";

  return "unknown";
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const allText: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvData = XLSX.utils.sheet_to_csv(sheet);
    allText.push(`[Sheet: ${sheetName}]\n${csvData}`);
  }

  return allText.join("\n\n");
}

export async function extractTextFromPlain(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

export function extractTextFromCSV(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data as Record<string, string>[];
  if (rows.length === 0) return text;

  const headers = Object.keys(rows[0] || {});
  let result = `CSV Data (${rows.length} rows, ${headers.length} columns)\n`;
  result += `Columns: ${headers.join(", ")}\n\n`;

  const previewRows = rows.slice(0, 50);
  result += headers.join("\t") + "\n";
  for (const row of previewRows) {
    result += headers.map((h) => row[h] || "").join("\t") + "\n";
  }
  if (rows.length > 50) {
    result += `\n... and ${rows.length - 50} more rows`;
  }

  return result;
}

export function extractTextFromTSV(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, delimiter: "\t" });
  const rows = parsed.data as Record<string, string>[];
  if (rows.length === 0) return text;

  const headers = Object.keys(rows[0] || {});
  let result = `TSV Data (${rows.length} rows, ${headers.length} columns)\n`;
  result += `Columns: ${headers.join(", ")}\n\n`;

  const previewRows = rows.slice(0, 50);
  result += headers.join("\t") + "\n";
  for (const row of previewRows) {
    result += headers.map((h) => row[h] || "").join("\t") + "\n";
  }
  if (rows.length > 50) {
    result += `\n... and ${rows.length - 50} more rows`;
  }

  return result;
}

export function extractTextFromJSON(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

export function extractTextFromXML(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export function extractTextFromMarkdown(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export function extractTextFromYAML(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export function extractTextFromHTML(buffer: Buffer): string {
  const text = buffer.toString("utf-8");
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return `[HTML Content]\n${stripped}`;
}

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  columnCount: number;
}

export function parseCSVForEDA(buffer: Buffer): CSVParseResult {
  const text = buffer.toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
  const rows = parsed.data as Record<string, string>[];
  const headers = Object.keys(rows[0] || {});

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnCount: headers.length,
  };
}

export async function extractTextFromFile(
  buffer: Buffer,
  fileType: FileType
): Promise<string | null> {
  switch (fileType) {
    case "pdf":
      return extractTextFromPDF(buffer);
    case "docx":
      return extractTextFromDocx(buffer);
    case "xlsx":
      return extractTextFromXlsx(buffer);
    case "csv":
      return extractTextFromCSV(buffer);
    case "tsv":
      return extractTextFromTSV(buffer);
    case "json":
      return extractTextFromJSON(buffer);
    case "xml":
      return extractTextFromXML(buffer);
    case "markdown":
      return extractTextFromMarkdown(buffer);
    case "yaml":
      return extractTextFromYAML(buffer);
    case "html":
      return extractTextFromHTML(buffer);
    case "text":
      return extractTextFromPlain(buffer);
    case "image":
    case "video":
      return null;
    default:
      try {
        const text = buffer.toString("utf-8");
        const nonPrintable = text.split("").filter((c) => {
          const code = c.charCodeAt(0);
          return code < 32 && code !== 9 && code !== 10 && code !== 13;
        }).length;
        if (nonPrintable / text.length < 0.1) {
          return text;
        }
      } catch {
        // ignore
      }
      return null;
  }
}

export function bufferToBase64DataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
