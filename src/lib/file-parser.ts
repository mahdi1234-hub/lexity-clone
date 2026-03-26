import mammoth from "mammoth";
import * as XLSX from "xlsx";

export type FileType = "pdf" | "docx" | "xlsx" | "image" | "video" | "text" | "unknown";

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
    ext === "xlsx" || ext === "xls" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  )
    return "xlsx";
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
    ["txt", "csv", "json", "xml", "html", "css", "js", "ts", "md", "py", "java", "c", "cpp", "h", "rb", "go", "rs", "sql", "yaml", "yml", "ini", "cfg", "log"].includes(ext)
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
    case "text":
      return extractTextFromPlain(buffer);
    case "image":
    case "video":
      return null;
    default:
      return null;
  }
}

export function bufferToBase64DataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
