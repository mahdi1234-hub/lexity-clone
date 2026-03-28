"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

interface CollaborativeEditorProps {
  roomId: string;
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ x: 0, y: 0 });
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const aiDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        style: "font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100%; padding: 24px;",
      },
    },
  });

  // Load saved document on mount
  useEffect(() => {
    const loadDocument = async () => {
      try {
        const res = await fetch(`/api/workspace?roomId=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.document) {
            try {
              const blocks = JSON.parse(data.document);
              editor.replaceBlocks(editor.document, blocks);
            } catch {
              // If parse fails, ignore
            }
          }
        }
      } catch {
        // Ignore load errors
      }
    };
    loadDocument();
  }, [roomId, editor]);

  // Auto-save document
  const saveDocument = useCallback(async () => {
    try {
      const blocks = editor.document;
      await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          document: JSON.stringify(blocks),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore save errors
    }
  }, [editor, roomId]);

  // Get AI autocomplete suggestion
  const getAiSuggestion = useCallback(async () => {
    try {
      // Get text content from all blocks
      const blocks = editor.document;
      const textContent = blocks
        .map((block) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const content = (block.content as any[]) || [];
          return content.map((c) => c.text || "").join("");
        })
        .filter(Boolean)
        .join("\n");

      if (textContent.length < 10) return;

      // Get cursor position for the suggestion popup
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSuggestionPos({ x: rect.left, y: rect.bottom + 4 });
      }

      setIsLoadingSuggestion(true);

      // Get the last few words as the prompt
      const lines = textContent.split("\n");
      const lastLine = lines[lines.length - 1] || "";
      const prompt = lastLine.slice(-100);
      const context = textContent.slice(-500);

      const res = await fetch("/api/ai-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.completion) {
          setAiSuggestion(data.completion);
          setShowSuggestion(true);
        }
      }
    } catch {
      // Ignore AI errors
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [editor]);

  // Accept AI suggestion
  const acceptSuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    const cursor = editor.getTextCursorPosition();
    if (cursor) {
      editor.insertInlineContent([{ type: "text", text: aiSuggestion, styles: {} }]);
    }
    setShowSuggestion(false);
    setAiSuggestion("");
  }, [aiSuggestion, editor]);

  // Dismiss suggestion
  const dismissSuggestion = useCallback(() => {
    setShowSuggestion(false);
    setAiSuggestion("");
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSuggestion && e.key === "Tab") {
        e.preventDefault();
        acceptSuggestion();
      } else if (showSuggestion && e.key === "Escape") {
        dismissSuggestion();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestion, acceptSuggestion, dismissSuggestion]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAF8F5",
      }}
    >
      {/* Editor toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          backgroundColor: "#F2EFEA",
          borderBottom: "1px solid #E8E4DE",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#2C2824",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Document Editor
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#8B7355",
              padding: "2px 8px",
              borderRadius: 4,
              backgroundColor: "rgba(196,140,86,0.1)",
            }}
          >
            {roomId}
          </span>
          {saved && (
            <span
              style={{
                fontSize: 10,
                color: "#6B8E6B",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Saved
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={getAiSuggestion}
            disabled={isLoadingSuggestion}
            style={{
              padding: "5px 12px",
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid #E8E4DE",
              cursor: "pointer",
              backgroundColor: "white",
              color: "#C48C56",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              opacity: isLoadingSuggestion ? 0.5 : 1,
            }}
          >
            {isLoadingSuggestion ? "Thinking..." : "AI Suggest (or type & wait)"}
          </button>
          <button
            onClick={saveDocument}
            style={{
              padding: "5px 12px",
              fontSize: 11,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              backgroundColor: "#C48C56",
              color: "white",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* BlockNote Editor */}
      <div
        style={{ flex: 1, overflow: "auto", position: "relative" }}
      >
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => {
            // Auto-save after 3 seconds of inactivity
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(saveDocument, 3000);

            // AI suggestion after 5 seconds of inactivity
            if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
            aiDebounceRef.current = setTimeout(getAiSuggestion, 5000);

            // Dismiss current suggestion on edit
            if (showSuggestion) dismissSuggestion();
          }}
        />

        {/* AI Suggestion Overlay */}
        {showSuggestion && aiSuggestion && (
          <div
            style={{
              position: "fixed",
              left: Math.max(16, suggestionPos.x),
              top: suggestionPos.y,
              maxWidth: 400,
              backgroundColor: "white",
              border: "1px solid #E8E4DE",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              padding: "10px 14px",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#8B7355",
                marginBottom: 6,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
              }}
            >
              AI Suggestion
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#5C5248",
                lineHeight: 1.5,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontStyle: "italic",
              }}
            >
              {aiSuggestion}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                borderTop: "1px solid #F2EFEA",
                paddingTop: 8,
              }}
            >
              <button
                onClick={acceptSuggestion}
                style={{
                  padding: "3px 10px",
                  fontSize: 10,
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#C48C56",
                  color: "white",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Accept (Tab)
              </button>
              <button
                onClick={dismissSuggestion}
                style={{
                  padding: "3px 10px",
                  fontSize: 10,
                  borderRadius: 4,
                  border: "1px solid #E8E4DE",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  color: "#8B7355",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Dismiss (Esc)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
