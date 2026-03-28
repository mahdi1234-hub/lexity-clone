import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-memory workflow storage (persisted per-session in this demo)
// In production, use a database like Supabase/Postgres
const workflowStore = new Map<string, Map<string, WorkflowRecord>>();

interface WorkflowRecord {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

function getUserWorkflows(userId: string): Map<string, WorkflowRecord> {
  if (!workflowStore.has(userId)) {
    workflowStore.set(userId, new Map());
  }
  return workflowStore.get(userId)!;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id || "anonymous";
  const workflows = getUserWorkflows(userId);
  const list = Array.from(workflows.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return NextResponse.json({ workflows: list });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id || "anonymous";
  const body = await req.json();
  const { id, name, description, nodes, edges } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }

  const workflows = getUserWorkflows(userId);
  const now = new Date().toISOString();
  const existing = workflows.get(id);

  const record: WorkflowRecord = {
    id,
    name,
    description: description || "",
    nodes: nodes || [],
    edges: edges || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    userId,
  };

  workflows.set(id, record);
  return NextResponse.json({ workflow: record });
}
