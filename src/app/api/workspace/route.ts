import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// In-memory workspace storage (per user, per room)
// In production, replace with a database
const workspaces = new Map<string, { document: string; updatedAt: string }>();

function getKey(userId: string, roomId: string) {
  return `${userId}:${roomId}`;
}

// GET - Load workspace data
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const roomId = req.nextUrl.searchParams.get("roomId") || "default";
  const key = getKey(userId, roomId);
  const data = workspaces.get(key);

  return NextResponse.json({
    document: data?.document || "",
    updatedAt: data?.updatedAt || null,
  });
}

// POST - Save workspace data
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  try {
    const { roomId, document } = await req.json();
    const key = getKey(userId, roomId || "default");

    workspaces.set(key, {
      document: document || "",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Workspace save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
