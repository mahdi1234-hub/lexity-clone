import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query") || "nature";
  const page = req.nextUrl.searchParams.get("page") || "1";
  const perPage = req.nextUrl.searchParams.get("per_page") || "12";

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Unsplash API error" }, { status: response.status });
    }

    const data = await response.json();

    const images = data.results.map((img: {
      id: string;
      urls: { small: string; regular: string; thumb: string };
      alt_description: string;
      description: string;
      user: { name: string; username: string };
      links: { html: string };
      width: number;
      height: number;
    }) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      small: img.urls.small,
      alt: img.alt_description || img.description || "",
      photographer: img.user.name,
      photographerUrl: `https://unsplash.com/@${img.user.username}`,
      link: img.links.html,
      width: img.width,
      height: img.height,
    }));

    return NextResponse.json({
      images,
      total: data.total,
      totalPages: data.total_pages,
    });
  } catch (error) {
    console.error("Unsplash search error:", error);
    return NextResponse.json({ error: "Failed to search images" }, { status: 500 });
  }
}
