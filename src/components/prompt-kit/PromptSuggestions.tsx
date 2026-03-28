"use client";

interface PromptSuggestionsProps {
  suggestions: { text: string; icon?: string }[];
  onSelect: (text: string) => void;
}

export default function PromptSuggestions({ suggestions, onSelect }: PromptSuggestionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion.text)}
          className="group flex items-start gap-2.5 px-4 py-3 rounded-xl border border-black/5 bg-white/40 backdrop-blur-sm hover:bg-white/60 hover:border-[#C48C56]/20 hover:shadow-md transition-all text-left"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span className="text-base mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
            {suggestion.icon || ""}
          </span>
          <span className="text-xs text-[#2C2824]/70 group-hover:text-[#2C2824] leading-relaxed transition-colors">
            {suggestion.text}
          </span>
        </button>
      ))}
    </div>
  );
}
