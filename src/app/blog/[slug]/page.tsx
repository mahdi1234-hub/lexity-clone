"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data.post || null);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex items-center justify-center">
        <div className="relative inline-flex text-[#C48C56]">
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F2EFEA] flex flex-col items-center justify-center gap-8">
        <h1
          className="text-4xl font-light tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Post not found
        </h1>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      {/* Header */}
      <header className="border-b border-[#d9d1c5]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Blog
          </Link>
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="w-full h-[50vh] md:h-[60vh] overflow-hidden relative">
          <div className="absolute inset-0 bg-black/20 z-10" />
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 lg:px-12 py-16 md:py-24">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {post.category && (
            <span
              className="text-xs uppercase tracking-widest text-[#C48C56]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {post.category.name}
            </span>
          )}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs uppercase tracking-widest opacity-40 px-3 py-1 border border-[#d9d1c5] rounded-full"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl tracking-tighter font-light leading-tight mb-8"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {post.title}
        </h1>

        {/* Author & Date */}
        <div className="flex items-center gap-4 pb-12 border-b border-[#d9d1c5]">
          {post.authors[0] && (
            <div className="flex items-center gap-3">
              {post.authors[0].image && (
                <img
                  src={post.authors[0].image}
                  alt={post.authors[0].name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {post.authors[0].name}
                </p>
                <p
                  className="text-xs opacity-50 font-light"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {formatDate(post.publishedAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="prose-blog mt-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Back to blog */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-3 bg-[#2C2824] text-[#F2EFEA] px-8 py-4 rounded-full text-base font-medium transition-all hover:scale-105 hover:bg-[#2F5D50] cursor-pointer"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to All Posts
        </Link>
      </div>

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
