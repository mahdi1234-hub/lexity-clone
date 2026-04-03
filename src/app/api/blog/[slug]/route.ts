import { NextResponse } from "next/server";

const MARBLECMS_API_URL = "https://api.marblecms.com/v1";
const MARBLECMS_API_KEY = process.env.MARBLECMS_API_KEY || "mpk_J188Q2cyEgO9eRWliv7XFDaV";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const res = await fetch(`${MARBLECMS_API_URL}/posts/${slug}`, {
      headers: {
        Authorization: `Bearer ${MARBLECMS_API_KEY}`,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 }
        );
      }
      throw new Error(`MarbleCMS API error: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}
