import { NextRequest, NextResponse } from "next/server";

async function edgestoreHandler(req: NextRequest) {
  try {
    const { handler } = await import("@/lib/edgestore");
    return handler(req);
  } catch (error) {
    console.error("EdgeStore not configured:", error);
    return NextResponse.json(
      { error: "EdgeStore not configured. Set EDGE_STORE_ACCESS_KEY and EDGE_STORE_SECRET_KEY." },
      { status: 503 }
    );
  }
}

export { edgestoreHandler as GET, edgestoreHandler as POST };
