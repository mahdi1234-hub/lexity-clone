import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface Report {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  fileSize: number;
  pdfData: string; // base64 encoded PDF
  thumbnailData?: string; // base64 encoded thumbnail image
  chartCount: number;
  rowCount: number;
  columnCount: number;
  dataSource: string;
}

// In-memory report storage per user
// In production, replace with a database
const reportsStore = new Map<string, Report[]>();

function getUserReports(userId: string): Report[] {
  return reportsStore.get(userId) || [];
}

// GET - List all reports for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const reports = getUserReports(userId);

  const search = req.nextUrl.searchParams.get("search")?.toLowerCase();
  const tag = req.nextUrl.searchParams.get("tag");
  const dateFrom = req.nextUrl.searchParams.get("dateFrom");
  const dateTo = req.nextUrl.searchParams.get("dateTo");

  let filtered = [...reports];

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  if (tag) {
    filtered = filtered.filter((r) => r.tags.includes(tag));
  }

  if (dateFrom) {
    filtered = filtered.filter((r) => r.createdAt >= dateFrom);
  }

  if (dateTo) {
    filtered = filtered.filter((r) => r.createdAt <= dateTo);
  }

  // Sort by newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Return reports without PDF data for listing (to keep response small)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const listing = filtered.map(({ pdfData: _pdf, ...rest }) => rest);

  // Collect all unique tags
  const allTags = Array.from(new Set(reports.flatMap((r) => r.tags)));

  return NextResponse.json({ reports: listing, tags: allTags, total: reports.length });
}

// POST - Save a new report
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  try {
    const body = await req.json();
    const {
      id,
      title,
      description,
      tags,
      pdfData,
      thumbnailData,
      chartCount,
      rowCount,
      columnCount,
      dataSource,
    } = body;

    if (!pdfData || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report: Report = {
      id: id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId,
      title,
      description: description || "",
      tags: tags || [],
      createdAt: new Date().toISOString(),
      fileSize: Math.round((pdfData.length * 3) / 4), // approx base64 to bytes
      pdfData,
      thumbnailData,
      chartCount: chartCount || 0,
      rowCount: rowCount || 0,
      columnCount: columnCount || 0,
      dataSource: dataSource || "CSV Upload",
    };

    const userReports = getUserReports(userId);
    userReports.push(report);
    reportsStore.set(userId, userReports);

    return NextResponse.json({
      success: true,
      report: { ...report, pdfData: undefined },
    });
  } catch (error) {
    console.error("Report save error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}
