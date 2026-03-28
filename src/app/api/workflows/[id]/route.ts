import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Shared store reference (same as parent route - in production use DB)
const workflowStore = new Map<string, Map<string, unknown>>();

function getUserWorkflows(userId: string): Map<string, unknown> {
  if (!workflowStore.has(userId)) {
    workflowStore.set(userId, new Map());
  }
  return workflowStore.get(userId)!;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id || "anonymous";
  const workflows = getUserWorkflows(userId);
  const workflow = workflows.get(params.id);
  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json({ workflow });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id || "anonymous";
  const workflows = getUserWorkflows(userId);
  workflows.delete(params.id);
  return NextResponse.json({ success: true });
}
