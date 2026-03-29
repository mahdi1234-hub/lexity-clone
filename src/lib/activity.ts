import prisma from "@/lib/prisma";

export type ActivityType =
  | "message_sent"
  | "file_uploaded"
  | "conversation_created"
  | "report_generated"
  | "collaboration_joined"
  | "login";

export async function trackActivity(
  userId: string,
  type: ActivityType,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
  }
}

export async function getUserStats(userId: string) {
  const [
    totalMessages,
    totalConversations,
    totalFiles,
    totalReports,
    recentActivities,
    messagesToday,
    messagesThisWeek,
    messagesThisMonth,
  ] = await Promise.all([
    prisma.message.count({ where: { userId } }),
    prisma.conversation.count({ where: { userId } }),
    prisma.fileUpload.count({ where: { userId } }),
    prisma.report.count({ where: { userId } }),
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.message.count({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.message.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalMessages,
    totalConversations,
    totalFiles,
    totalReports,
    recentActivities,
    messagesToday,
    messagesThisWeek,
    messagesThisMonth,
  };
}
