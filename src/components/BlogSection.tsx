"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BlogAuthor {
  id: string;
  name: string;
  image: string | null;
  slug: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  content: string;
  featured: boolean;
  coverImage: string | null;
  description: string | null;
  publishedAt: string;
  updatedAt: string;
  authors: BlogAuthor[];
  category: BlogCategory | null;
  tags: BlogTag[];
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blog?limit=6");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html: string) => {
    const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
    if (tmp) {
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }
    return html.replace(/<[^>]*>/g, "");
  };

  if (loading) {
    return (
      <section className="py-32 bg-[#F2EFEA]">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
            <h2
              className="text-5xl md:text-6xl tracking-tighter font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Blogs
            </h2>
            <div className="relative inline-flex text-[#C48C56]">
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-flashlight p-0 overflow-hidden">
                <div className="relative z-10">
                  <div className="h-56 bg-[#e8e3db] animate-pulse" />
                  <div className="p-8 space-y-4">
                    <div className="h-3 w-20 bg-[#e8e3db] animate-pulse rounded" />
                    <div className="h-6 w-3/4 bg-[#e8e3db] animate-pulse rounded" />
                    <div className="h-4 w-full bg-[#e8e3db] animate-pulse rounded" />
                    <div className="h-4 w-2/3 bg-[#e8e3db] animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <section className="py-32 bg-[#F2EFEA]" id="blog">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section Header - matches the Features section pattern */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
          <h2
            className="text-5xl md:text-6xl tracking-tighter font-light"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            From the
            <br />
            Blog
          </h2>
          <div className="relative inline-flex text-[#C48C56]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h10" />
            </svg>
            <div className="sonar-ring"></div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <Link
              href={`/blog/${post.slug}`}
              key={post.id}
              className="card-flashlight p-0 overflow-hidden cursor-pointer group block"
            >
              <div className="relative z-10">
                {/* Cover Image */}
                {post.coverImage ? (
                  <div className="h-56 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                  </div>
                ) : (
                  <div className="h-56 bg-gradient-to-br from-[#2C2824] to-[#2F5D50] flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#F2EFEA]/30" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h10" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-8">
                  {/* Meta line */}
                  <div className="flex items-center gap-3 mb-4">
                    <p
                      className="opacity-50 text-xs uppercase tracking-widest"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    {post.category && (
                      <>
                        <div className="w-4 h-[1px] bg-current opacity-20" />
                        <p
                          className="text-xs uppercase tracking-widest text-[#C48C56]"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {post.category.name}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-2xl font-light mb-4 tracking-tight group-hover:text-[#2F5D50] transition-colors duration-300"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {post.title}
                  </h3>

                  {/* Description/Excerpt */}
                  <p
                    className="opacity-70 leading-relaxed font-light text-sm line-clamp-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {post.description || stripHtml(post.content).slice(0, 150)}
                  </p>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-[#d9d1c5] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {post.authors[0]?.image && (
                        <img
                          src={post.authors[0].image}
                          alt={post.authors[0].name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <p
                        className="text-xs opacity-50 font-light"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {post.authors[0]?.name || "Anonymous"}
                      </p>
                    </div>
                    <p
                      className="text-xs opacity-40 font-light"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        {posts.length >= 3 && (
          <div className="mt-16 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:bg-[#2F5D50] cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              View All Posts
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
