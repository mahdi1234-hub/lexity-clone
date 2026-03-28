import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY || "";
const secret = process.env.STREAM_API_SECRET || "";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const userName = session.user.name || "Anonymous";
  const userImage = session.user.image || "";

  try {
    const client = new StreamClient(apiKey, secret);

    // Upsert user in Stream
    await client.upsertUsers([
      {
        id: userId,
        name: userName,
        image: userImage,
        role: "user",
      },
    ]);

    // Generate token valid for 24 hours
    const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = client.generateUserToken({
      user_id: userId,
      exp: expiresAt,
      iat: issuedAt,
    });

    return NextResponse.json({
      token,
      apiKey,
      userId,
      userName,
      userImage,
    });
  } catch (error) {
    console.error("Stream token error:", error);
    return NextResponse.json(
      { error: "Failed to generate video token" },
      { status: 500 }
    );
  }
}
