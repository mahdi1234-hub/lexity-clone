import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listUserConversations } from "@/lib/pinecone";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const conversations = await listUserConversations(userId!);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return NextResponse.json({ conversations: [] });
  }
}
