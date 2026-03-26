import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConversationMessages, deleteConversation } from "@/lib/pinecone";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const messages = await getConversationMessages(userId!, params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    return NextResponse.json({ messages: [] });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    await deleteConversation(userId!, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
