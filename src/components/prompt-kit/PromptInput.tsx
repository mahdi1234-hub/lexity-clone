"use client";

import { useRef, useCallback } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFileSelect?: (files: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  rateLimited?: boolean;
  remainingMessages?: number;
}

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  onFileSelect,
  placeholder = "Type your message...",
  disabled = false,
  isLoading = false,
  rateLimited = false,
  remainingMessages,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      // Auto-resize
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileSelect && e.target.files) {
      onFileSelect(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative">
      {/* Rate limit warning */}
      {rateLimited && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span
            className="text-xs text-red-400"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Daily message limit reached (5/5). Please try again tomorrow.
          </span>
        </div>
      )}

      {/* Input container */}
      <div
        className={`flex items-end gap-2 rounded-2xl border bg-white/80 backdrop-blur-xl px-3 py-2 transition-all ${
          rateLimited
            ? "border-red-500/20 opacity-60"
            : "border-black/10 focus-within:border-[#C48C56]/40 focus-within:shadow-lg focus-within:shadow-[#C48C56]/5"
        }`}
      >
        {/* File upload */}
        {onFileSelect && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.mp4,.webm,.avi,.mov,.mkv,.txt,.csv,.json,.xml,.html,.css,.js,.ts,.md,.py,.java,.c,.cpp,.sql,.yaml,.yml,.log"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || rateLimited}
              className="p-2 rounded-xl hover:bg-black/5 transition-all disabled:opacity-30 flex-shrink-0 group"
              title="Upload files"
            >
              <svg className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity text-[#C48C56]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={rateLimited ? "Daily limit reached" : placeholder}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm p-1.5 max-h-[200px] placeholder:opacity-40"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          disabled={disabled || rateLimited}
        />

        {/* Remaining messages indicator */}
        {remainingMessages !== undefined && remainingMessages < 5 && !rateLimited && (
          <span className="text-[10px] text-[#C48C56]/60 flex-shrink-0 self-center mr-1">
            {remainingMessages}/5
          </span>
        )}

        {/* Send button */}
        <button
          onClick={onSubmit}
          disabled={!value.trim() || disabled || rateLimited}
          className="p-2 rounded-xl bg-[#2C2824] text-[#F2EFEA] transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 flex-shrink-0"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
