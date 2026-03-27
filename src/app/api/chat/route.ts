import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient, createEmbedding, MODELS } from "@/lib/groq";
import { upsertMemory, queryMemory, getConversationMessages, getRagIndex } from "@/lib/pinecone";
import { generateEmbedding, chunkText } from "@/lib/embeddings";
import { detectFileType, extractTextFromFile } from "@/lib/file-parser";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

interface FileData {
  name: string;
  mimeType: string;
  base64: string;
  extractedText?: string;
  type: string;
}

async function getRelevantContext(query: string, namespace: string): Promise<string[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const index = getRagIndex();
    const results = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    return (
      results.matches
        ?.filter((m) => (m.score || 0) > 0.3)
        .map((m) => (m.metadata?.text as string) || "") || []
    );
  } catch (error) {
    console.error("Error querying RAG index:", error);
    return [];
  }
}

async function storeDocumentInPinecone(
  text: string,
  filename: string,
  namespace: string
): Promise<void> {
  try {
    const chunks = chunkText(text, 500, 100);
    const index = getRagIndex();

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await generateEmbedding(chunk);
        return {
          id: `${filename}-chunk-${i}-${Date.now()}`,
          values: embedding,
          metadata: {
            text: chunk,
            filename,
            chunkIndex: i,
          },
        };
      })
    );

    for (let i = 0; i < vectors.length; i += 100) {
      const batch = vectors.slice(i, i + 100);
      await index.namespace(namespace).upsert({ records: batch });
    }
  } catch (error) {
    console.error("Error storing in RAG index:", error);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const namespace = `user_${userId}`;

  try {
    const formData = await req.formData();
    const message = (formData.get("message") as string) || "";
    const conversationId = formData.get("conversationId") as string;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    // Process uploaded files
    const files: FileData[] = [];
    const fileEntries = formData.getAll("files");

    for (const entry of fileEntries) {
      if (entry instanceof File && entry.size > 0) {
        const buffer = Buffer.from(await entry.arrayBuffer());
        const fileType = detectFileType(entry.name, entry.type);

        const fileData: FileData = {
          name: entry.name,
          mimeType: entry.type,
          base64: buffer.toString("base64"),
          type: fileType,
        };

        // Extract text from text-based files
        if (["pdf", "docx", "xlsx", "csv", "tsv", "json", "xml", "markdown", "yaml", "html", "text"].includes(fileType)) {
          try {
            const text = await extractTextFromFile(buffer, fileType);
            if (text) {
              fileData.extractedText = text;
              await storeDocumentInPinecone(text, entry.name, namespace);
            }
          } catch (parseErr) {
            console.error(`Error parsing ${entry.name}:`, parseErr);
          }
        }

        files.push(fileData);
      }
    }

    const hasFiles = files.length > 0;
    const hasImages = files.some((f) => f.type === "image");
    const hasVideos = files.some((f) => f.type === "video");
    const needsVision = hasImages || hasVideos;
    const modelToUse = needsVision ? MODELS.vision : MODELS.text;
    const textFiles = files.filter((f) => f.extractedText);

    // Get conversation history from memory
    let history: { role: string; content: string }[] = [];
    let memoryContext = "";

    try {
      history = await getConversationMessages(userId, conversationId);

      if (message) {
        const queryEmbedding = await createEmbedding(message);
        const relevantMemories = await queryMemory(userId, queryEmbedding, 3);

        if (relevantMemories.length > 0) {
          const crossConvMemories = relevantMemories.filter(
            (m) => m.metadata && m.metadata.conversationId !== conversationId
          );
          if (crossConvMemories.length > 0) {
            memoryContext =
              "\n\nRelevant context from previous conversations:\n" +
              crossConvMemories
                .map((m) => `- ${m.metadata!.role}: ${m.metadata!.content}`)
                .join("\n");
          }
        }
      }
    } catch (memErr) {
      console.error("Memory retrieval error (non-fatal):", memErr);
    }

    // Get RAG context from uploaded documents
    let ragContext = "";
    if (message && (textFiles.length > 0 || hasFiles)) {
      try {
        const contextChunks = await getRelevantContext(message, namespace);
        if (contextChunks.length > 0) {
          ragContext = `\n\nRelevant context from uploaded documents:\n${contextChunks.join("\n---\n")}`;
        }
      } catch {
        // Non-fatal
      }
    }

    // Build system prompt
    const systemPrompt = `You are a helpful, intelligent AI assistant. You have a warm and professional tone. You remember past conversations with this user and can reference them when relevant.
You can analyze documents in many formats: PDF, DOCX, XLSX, CSV, TSV, JSON, XML, YAML, Markdown, HTML, and plain text files.
You can also analyze images and videos when shared.
When documents are uploaded, you have access to their extracted text content.
When CSV or tabular data is uploaded, you can perform exploratory data analysis (EDA).
Always reference specific content from uploaded files when answering questions about them.
Be helpful, thorough, and precise in your responses.${memoryContext}${ragContext}`;

    // Build messages array
    type ContentPart = { type: string; text?: string; image_url?: { url: string } };
    type GroqMessage = {
      role: "system" | "user" | "assistant";
      content: string | ContentPart[];
    };

    const llmMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    history.forEach((msg) => {
      llmMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    });

    // Build current user message
    if (needsVision) {
      const content: ContentPart[] = [];
      let textContent = message || "";

      for (const file of textFiles) {
        textContent += `\n\n[Content from ${file.name}]:\n${file.extractedText?.substring(0, 3000)}`;
      }
      if (textContent) {
        content.push({ type: "text", text: textContent });
      }

      for (const file of files) {
        if (file.type === "image") {
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${file.mimeType};base64,${file.base64}`,
            },
          });
        }
        if (file.type === "video") {
          content.push({
            type: "text",
            text: `[Video file uploaded: ${file.name}]. Please analyze this video based on what you can determine from its name and any context provided.`,
          });
        }
      }

      llmMessages.push({ role: "user", content });
    } else {
      let textContent = message || "";
      for (const file of textFiles) {
        textContent += `\n\n[Content from ${file.name}]:\n${file.extractedText?.substring(0, 4000)}`;
      }
      for (const file of files.filter((f) => f.type === "video")) {
        textContent += `\n\n[Video file uploaded: ${file.name}]. Please provide analysis based on the filename and any additional context.`;
      }
      if (!textContent.trim()) {
        textContent = "Please analyze the uploaded files.";
      }
      llmMessages.push({ role: "user", content: textContent });
    }

    // Store user message in memory (non-blocking)
    const userMsgId = uuidv4();
    const userTimestamp = new Date().toISOString();
    const messageForMemory = message || (files.length > 0 ? `[Uploaded: ${files.map((f) => f.name).join(", ")}]` : "");
    if (messageForMemory) {
      createEmbedding(messageForMemory)
        .then((userEmbedding) => {
          upsertMemory(userId, conversationId, userMsgId, userEmbedding, {
            role: "user",
            content: messageForMemory,
            conversationId,
            timestamp: userTimestamp,
          }).catch((err) => console.error("User memory upsert error:", err));
        })
        .catch((err) => console.error("User embedding error:", err));
    }

    // Call LLM
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: llmMessages as Parameters<typeof groq.chat.completions.create>[0]["messages"],
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    });

    // Stream response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Store assistant response in memory (non-blocking)
          const assistantMsgId = uuidv4();
          const assistantTimestamp = new Date().toISOString();
          createEmbedding(fullResponse)
            .then((assistantEmbedding) => {
              upsertMemory(userId, conversationId, assistantMsgId, assistantEmbedding, {
                role: "assistant",
                content: fullResponse,
                conversationId,
                timestamp: assistantTimestamp,
              }).catch((err) => console.error("Assistant memory upsert error:", err));
            })
            .catch((err) => console.error("Assistant embedding error:", err));

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
