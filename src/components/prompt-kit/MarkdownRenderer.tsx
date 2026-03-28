"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded-md bg-white/10 hover:bg-white/20 text-[#F2EFEA]/60 hover:text-[#F2EFEA] transition-all opacity-0 group-hover:opacity-100"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-[#F2EFEA]">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-[#F2EFEA]">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1.5 mt-2.5 first:mt-0 text-[#F2EFEA]">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1 ml-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[#F2EFEA]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-[#F2EFEA]/80">{children}</em>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C48C56] hover:text-[#C48C56]/80 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#C48C56]/30 pl-3 my-2 text-[#F2EFEA]/60 italic">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isInline = !className;
          const codeText = String(children).replace(/\n$/, "");

          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded-md bg-[#2C2824] text-[#C48C56] text-[0.85em] font-mono">
                {children}
              </code>
            );
          }

          const language = className?.replace("language-", "") || "";

          return (
            <div className="relative group my-3 rounded-xl overflow-hidden border border-[#3D3530]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#2C2824] border-b border-[#3D3530]">
                <span className="text-[10px] text-[#F2EFEA]/30 font-mono uppercase tracking-wider">
                  {language || "code"}
                </span>
              </div>
              <CopyButton text={codeText} />
              <pre className="p-3 overflow-x-auto bg-[#1A1714]">
                <code className="text-xs font-mono text-[#F2EFEA]/80 leading-relaxed">
                  {children}
                </code>
              </pre>
            </div>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-[#3D3530]">
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#2C2824]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-medium text-[#F2EFEA]/60 border-b border-[#3D3530]">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-[#F2EFEA]/70 border-b border-[#3D3530]/50">{children}</td>
        ),
        hr: () => <hr className="my-4 border-[#3D3530]" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
