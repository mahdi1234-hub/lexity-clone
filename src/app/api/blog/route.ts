import { NextResponse } from "next/server";

const MARBLECMS_API_URL = "https://api.marblecms.com/v1";
const MARBLECMS_API_KEY = process.env.MARBLECMS_API_KEY || "mpk_J188Q2cyEgO9eRWliv7XFDaV";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";

    const res = await fetch(
      `${MARBLECMS_API_URL}/posts?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${MARBLECMS_API_KEY}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      throw new Error(`MarbleCMS API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}
