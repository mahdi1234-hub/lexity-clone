import prisma from "@/lib/prisma";

export type ActivityType =
  | "message_sent"
  | "file_uploaded"
  | "conversation_created"
  | "report_generated"
  | "collaboration_joined"
  | "web_search"
  | "geospatial_query"
  | "login";

/**
 * Ensures a user exists in the database. Uses the session's user ID (Google sub)
 * as the primary key. If the user doesn't exist, creates them.
 * Returns the database user ID.
 */
export async function ensureUser(sessionUser: {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<string> {
  if (!sessionUser.id) throw new Error("No user ID");

  try {
    const existing = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (existing) {
      // Update name/image if changed
      if (existing.name !== sessionUser.name || existing.image !== sessionUser.image) {
        await prisma.user.update({
          where: { id: sessionUser.id },
          data: {
            name: sessionUser.name || existing.name,
            image: sessionUser.image || existing.image,
            updatedAt: new Date(),
          },
        });
      }
      return existing.id;
    }

    // Create new user with the session ID (Google sub) as the primary key
    const newUser = await prisma.user.create({
      data: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image,
      },
    });
    return newUser.id;
  } catch (error) {
    // If there's a unique constraint on email, try to find by email
    if (sessionUser.email) {
      const byEmail = await prisma.user.findUnique({
        where: { email: sessionUser.email },
      });
      if (byEmail) return byEmail.id;
    }
    console.error("ensureUser error:", error);
    return sessionUser.id; // Return the session ID as fallback
  }
}

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
