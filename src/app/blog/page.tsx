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
  tags: { id: string; name: string; slug: string }[];
}

interface Pagination {
  limit: number;
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
  totalPages: number;
  totalItems: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog?page=${currentPage}&limit=9`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPosts(data.posts || []);
        setPagination(data.pagination || null);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [currentPage]);

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

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Header */}
      <header className="border-b border-[#d9d1c5]">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div>
              <div
                className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f] mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#C48C56]"></span>
                Blog
              </div>
              <h1
                className="text-5xl md:text-7xl tracking-tighter font-light leading-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Insights &<br />Perspectives
              </h1>
            </div>
            <p
              className="max-w-sm text-[15px] leading-8 text-[#5f5851] font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Explore our latest thoughts on AI, technology, and innovation.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 border-t border-[#d9d1c5]" />

      {/* Posts Grid */}
      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card-flashlight p-0 overflow-hidden">
                  <div className="relative z-10">
                    <div className="h-56 bg-[#e8e3db] animate-pulse" />
                    <div className="p-8 space-y-4">
                      <div className="h-3 w-20 bg-[#e8e3db] animate-pulse rounded" />
                      <div className="h-6 w-3/4 bg-[#e8e3db] animate-pulse rounded" />
                      <div className="h-4 w-full bg-[#e8e3db] animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-32">
              <p
                className="text-lg opacity-50 font-light"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                No blog posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {posts.map((post, index) => (
                  <Link
                    href={`/blog/${post.slug}`}
                    key={post.id}
                    className="card-flashlight p-0 overflow-hidden cursor-pointer group block"
                  >
                    <div className="relative z-10">
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

                      <div className="p-8">
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

                        <h3
                          className="text-2xl font-light mb-4 tracking-tight group-hover:text-[#2F5D50] transition-colors duration-300"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {post.title}
                        </h3>

                        <p
                          className="opacity-70 leading-relaxed font-light text-sm line-clamp-3"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {post.description || stripHtml(post.content).slice(0, 150)}
                        </p>

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

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.previousPage}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d9d1c5] text-sm font-light transition-all hover:bg-[#2C2824] hover:text-[#F2EFEA] hover:border-[#2C2824] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current disabled:hover:border-[#d9d1c5]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Previous
                  </button>
                  <span
                    className="text-sm opacity-50 font-light"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!pagination.nextPage}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d9d1c5] text-sm font-light transition-all hover:bg-[#2C2824] hover:text-[#F2EFEA] hover:border-[#2C2824] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current disabled:hover:border-[#d9d1c5]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Next
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2824] text-[#F2EFEA] py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p
            className="text-sm opacity-70 font-light tracking-wide"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Made With Love By Louati Mahdi
          </p>
        </div>
      </footer>
    </div>
  );
}
