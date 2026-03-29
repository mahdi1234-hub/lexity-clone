import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import aj from "@/lib/arcjet";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  try {
    const decision = await aj.protect(req, { userId });

    const remaining = decision.reason?.isRateLimit()
      ? (decision.reason as { remaining?: number }).remaining ?? 0
      : 5;

    return NextResponse.json({
      allowed: !decision.isDenied(),
      remaining: Math.max(0, remaining),
      limit: 10,
      resetIn: "24 hours",
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    return NextResponse.json({
      allowed: true,
      remaining: 10,
      limit: 10,
      resetIn: "24 hours",
    });
  }
}
