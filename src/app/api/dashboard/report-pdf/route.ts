import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStats, trackActivity } from "@/lib/activity";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  try {
    const stats = await getUserStats(userId);

    // Get all conversations with message counts
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true },
        },
      },
    });

    // Get file uploads
    const files = await prisma.fileUpload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Get activity breakdown
    const activityBreakdown = await prisma.userActivity.groupBy({
      by: ["type"],
      where: { userId },
      _count: true,
    });

    // Save report record
    const report = await prisma.report.create({
      data: {
        userId,
        title: `Activity Report - ${new Date().toLocaleDateString()}`,
        type: "activity",
        content: JSON.stringify({
          generatedAt: new Date().toISOString(),
          stats,
          conversationCount: conversations.length,
          fileCount: files.length,
          activityBreakdown,
        }),
      },
    });

    await trackActivity(userId, "report_generated", { reportId: report.id });

    // Return report data as JSON (client-side will generate PDF)
    return NextResponse.json({
      reportId: report.id,
      generatedAt: new Date().toISOString(),
      user: {
        name: session.user.name,
        email: session.user.email,
      },
      stats: {
        totalMessages: stats.totalMessages,
        totalConversations: stats.totalConversations,
        totalFiles: stats.totalFiles,
        totalReports: stats.totalReports,
        messagesToday: stats.messagesToday,
        messagesThisWeek: stats.messagesThisWeek,
        messagesThisMonth: stats.messagesThisMonth,
      },
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title || "Untitled",
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.content?.substring(0, 100) || "",
        lastActivity: c.updatedAt,
      })),
      files: files.map((f) => ({
        id: f.id,
        filename: f.filename,
        mimeType: f.mimeType,
        size: f.size,
        uploadedAt: f.createdAt,
      })),
      activityBreakdown: activityBreakdown.map((a) => ({
        type: a.type,
        count: a._count,
      })),
    });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
