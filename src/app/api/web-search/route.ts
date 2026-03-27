import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { selectRelevantContent } from "@/lib/content-selection";
import Groq from "groq-sdk";

export const maxDuration = 60;

interface SearchSource {
  url: string;
  title: string;
  description?: string;
  content?: string;
  markdown?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
}

interface NewsResult {
  url: string;
  title: string;
  description?: string;
  publishedDate?: string;
  source?: string;
  image?: string;
}

interface ImageResult {
  url: string;
  title: string;
  thumbnail?: string;
  source?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { query, conversationHistory } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!firecrawlApiKey || !groqApiKey) {
      return new Response(JSON.stringify({ error: "API keys not configured" }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };

        try {
          // Status: searching
          send("status", { message: "Searching the web..." });

          // Call Firecrawl v2 search
          const searchResponse = await fetch("https://api.firecrawl.dev/v2/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              sources: ["web", "news", "images"],
              limit: 6,
              scrapeOptions: {
                formats: ["markdown"],
                onlyMainContent: true,
                maxAge: 86400000,
              },
            }),
          });

          if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(`Firecrawl error: ${errorData.error || searchResponse.statusText}`);
          }

          const searchResult = await searchResponse.json();
          const searchData = searchResult.data || {};

          const webResults = searchData.web || [];
          const newsData = searchData.news || [];
          const imagesData = searchData.images || [];

          // Transform sources
          const sources: SearchSource[] = webResults
            .map((item: Record<string, string | undefined>) => ({
              url: item.url,
              title: item.title || item.url,
              description: item.description || item.snippet,
              content: item.content,
              markdown: item.markdown,
              favicon: item.favicon,
              image: item.ogImage || item.image,
              siteName: item.url ? new URL(item.url).hostname : undefined,
            }))
            .filter((item: SearchSource) => item.url);

          const newsResults: NewsResult[] = newsData
            .map((item: Record<string, string | undefined>) => ({
              url: item.url,
              title: item.title,
              description: item.snippet || item.description,
              publishedDate: item.date,
              source: item.source || (item.url ? new URL(item.url).hostname : undefined),
              image: item.imageUrl,
            }))
            .filter((item: NewsResult) => item.url);

          const imageResults: ImageResult[] = imagesData
            .map((item: Record<string, string | number | undefined>) => {
              if (!item.url || !item.imageUrl) return null;
              return {
                url: item.url as string,
                title: (item.title as string) || "Untitled",
                thumbnail: item.imageUrl as string,
                source: item.url ? new URL(item.url as string).hostname : undefined,
              };
            })
            .filter(Boolean) as ImageResult[];

          // Send sources
          send("sources", { sources, newsResults, imageResults });

          // Status: generating answer
          send("status", { message: "Generating answer..." });

          // Build context from sources
          const context = sources
            .map((source: SearchSource, index: number) => {
              const content = source.markdown || source.content || "";
              const relevantContent = selectRelevantContent(content, query, 2000);
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevantContent}`;
            })
            .join("\n\n---\n\n");

          // Build messages for Groq
          const groqClient = new Groq({ apiKey: groqApiKey });

          const systemPrompt = `You are a helpful search assistant. Answer the user's query based on the provided web sources.

FORMATTING RULES:
- NEVER use LaTeX/math syntax ($...$) for regular numbers
- Write ALL numbers as plain text: "1 million" NOT "$1$ million"
- Use markdown for readability
- Keep responses natural and conversational
- Include citations inline as [1], [2], etc. when referencing sources
- Citations correspond to source order (first source = [1], second = [2], etc.)
- Be thorough but concise`;

          const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
          ];

          // Add conversation history if available
          if (conversationHistory && Array.isArray(conversationHistory)) {
            for (const msg of conversationHistory.slice(-4)) {
              messages.push({
                role: msg.role as "user" | "assistant",
                content: msg.content,
              });
            }
          }

          messages.push({
            role: "user",
            content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`,
          });

          // Stream the response
          const completion = await groqClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages,
            stream: true,
            max_tokens: 2048,
            temperature: 0.7,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              send("content", { content });
            }
          }

          // Generate follow-up questions
          try {
            const followUpCompletion = await groqClient.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content: `Generate 4 natural follow-up questions based on the query and sources. Return only the questions, one per line, no numbering or bullets. Make them genuinely helpful and diverse.`,
                },
                {
                  role: "user",
                  content: `Query: ${query}\n\nAvailable sources about: ${sources.map((s: SearchSource) => s.title).join(", ")}`,
                },
              ],
              max_tokens: 300,
              temperature: 0.7,
            });

            const followUpText = followUpCompletion.choices[0]?.message?.content || "";
            const followUpQuestions = followUpText
              .split("\n")
              .map((q: string) => q.trim())
              .filter((q: string) => q.length > 0)
              .slice(0, 4);

            send("followup", { questions: followUpQuestions });
          } catch {
            // Non-fatal
          }

          send("done", {});
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Search failed";
          send("error", { message: errorMessage });
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
    console.error("Web search error:", error);
    return new Response(JSON.stringify({ error: "Search failed" }), { status: 500 });
  }
}
