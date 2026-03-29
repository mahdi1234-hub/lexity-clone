import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStats } from "@/lib/activity";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  try {
    const stats = await getUserStats(userId);

    // Get daily message counts for the last 7 days
    const dailyMessages = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.message.count({
        where: {
          userId,
          createdAt: { gte: date, lt: nextDate },
        },
      });

      dailyMessages.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    // Get recent conversations
    const recentConversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    // Get recent file uploads
    const recentFiles = await prisma.fileUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      stats,
      dailyMessages,
      recentConversations,
      recentFiles,
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
