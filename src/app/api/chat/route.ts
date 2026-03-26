import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groq, createEmbedding } from "@/lib/groq";
import { upsertMemory, queryMemory, getConversationMessages } from "@/lib/pinecone";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;
  const { message, conversationId } = await req.json();

  if (!message || !conversationId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // Get conversation history from memory (non-blocking on failure)
    let history: { role: string; content: string }[] = [];
    let memoryContext = "";

    try {
      history = await getConversationMessages(userId, conversationId);

      // Create embedding for current message to find relevant past context
      const queryEmbedding = await createEmbedding(message);

      // Query for relevant memories across ALL conversations for this user
      const relevantMemories = await queryMemory(userId, queryEmbedding, 3);

      // Build context from relevant memories (cross-conversation)
      if (relevantMemories.length > 0) {
        const crossConvMemories = relevantMemories.filter(
          (m) => m.metadata && m.metadata.conversationId !== conversationId
        );
        if (crossConvMemories.length > 0) {
          memoryContext = "\n\nRelevant context from previous conversations:\n" +
            crossConvMemories
              .map((m) => `- ${m.metadata!.role}: ${m.metadata!.content}`)
              .join("\n");
        }
      }
    } catch (memErr) {
      console.error("Memory retrieval error (non-fatal):", memErr);
    }

    // Build messages for LLM
    const systemPrompt = `You are a helpful, intelligent AI assistant. You have a warm and professional tone. You remember past conversations with this user and can reference them when relevant.${memoryContext}`;

    const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    history.forEach((msg) => {
      llmMessages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    });

    // Add current message
    llmMessages.push({ role: "user", content: message });

    // Store user message in memory (non-blocking)
    const userMsgId = uuidv4();
    const userTimestamp = new Date().toISOString();
    createEmbedding(message).then((userEmbedding) => {
      upsertMemory(userId, conversationId, userMsgId, userEmbedding, {
        role: "user",
        content: message,
        conversationId,
        timestamp: userTimestamp,
      }).catch((err) => console.error("User memory upsert error (non-fatal):", err));
    }).catch((err) => console.error("User embedding error (non-fatal):", err));

    // Stream response from LLM
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: llmMessages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    // Create a ReadableStream for SSE
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
          createEmbedding(fullResponse).then((assistantEmbedding) => {
            upsertMemory(
              userId,
              conversationId,
              assistantMsgId,
              assistantEmbedding,
              {
                role: "assistant",
                content: fullResponse,
                conversationId,
                timestamp: assistantTimestamp,
              }
            ).catch((err) => console.error("Assistant memory upsert error (non-fatal):", err));
          }).catch((err) => console.error("Assistant embedding error (non-fatal):", err));

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
