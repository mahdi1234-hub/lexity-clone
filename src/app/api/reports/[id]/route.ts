import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Reference the same in-memory store
// In a real app this would be a shared database
const reportsStore = new Map<string, Array<{
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  fileSize: number;
  pdfData: string;
  thumbnailData?: string;
  chartCount: number;
  rowCount: number;
  columnCount: number;
  dataSource: string;
}>>();

// GET - Get a specific report (with PDF data)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const reports = reportsStore.get(userId) || [];
  const report = reports.find((r) => r.id === params.id);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ report });
}

// DELETE - Delete a specific report
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const reports = reportsStore.get(userId) || [];
  const index = reports.findIndex((r) => r.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  reports.splice(index, 1);
  reportsStore.set(userId, reports);

  return NextResponse.json({ success: true });
}
