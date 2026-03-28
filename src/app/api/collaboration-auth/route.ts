import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

// Generate a consistent color from a string (user ID)
function stringToColor(str: string): string {
  const colors = [
    "#E57373", "#F06292", "#BA68C8", "#9575CD",
    "#7986CB", "#64B5F6", "#4FC3F7", "#4DD0E1",
    "#4DB6AC", "#81C784", "#AED581", "#DCE775",
    "#FFD54F", "#FFB74D", "#FF8A65", "#A1887F",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in to collaborate" },
      { status: 401 }
    );
  }

  const userId = (session.user as { id?: string }).id!;
  const userName = session.user.name || "Anonymous";
  const userEmail = session.user.email || "";
  const userAvatar = session.user.image || undefined;
  const userColor = stringToColor(userId);

  try {
    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        color: userColor,
      },
    });

    // Grant access to all collaboration rooms
    liveblocksSession.allow("*", liveblocksSession.FULL_ACCESS);

    const { body, status } = await liveblocksSession.authorize();
    return new NextResponse(body, { status });
  } catch (error) {
    console.error("Collaboration auth error:", error);
    return NextResponse.json(
      { error: "Failed to authorize collaboration session" },
      { status: 500 }
    );
  }
}
