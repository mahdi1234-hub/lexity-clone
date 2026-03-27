import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/groq";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, conversationHistory } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const systemPrompt = `You are a graph data extraction AI. Given a user prompt and optionally conversation history, you must analyze the context and generate a JSON graph structure that visualizes relationships, concepts, or entities mentioned.

Your output MUST be valid JSON only (no markdown, no explanation) with this exact structure:
{
  "title": "Short descriptive title for the graph",
  "nodes": [
    {
      "id": "unique_id",
      "label": "Display Label",
      "category": "category_name",
      "size": 10,
      "description": "Brief description of this node"
    }
  ],
  "edges": [
    {
      "source": "node_id_1",
      "target": "node_id_2",
      "label": "relationship description",
      "weight": 1
    }
  ]
}

Rules:
- Generate meaningful nodes and edges based on the context
- Use different categories for nodes (e.g., "person", "concept", "topic", "event", "technology", "place", "organization")
- Size nodes by importance (5-20 range)
- Weight edges by strength of relationship (1-5 range)
- Always generate at least 3 nodes and 2 edges
- Make the graph informative and insightful
- If conversation history is provided, extract relationships from the actual conversations
- Labels should be concise but descriptive
- Edge labels should describe the nature of the relationship`;

    const userContent = conversationHistory
      ? `User prompt: "${prompt}"\n\nConversation history:\n${conversationHistory}`
      : `User prompt: "${prompt}"`;

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 4096,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from LLM" }, { status: 500 });
    }

    const graphData = JSON.parse(content);

    // Validate the structure
    if (!graphData.nodes || !graphData.edges || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
      return NextResponse.json({ error: "Invalid graph structure from LLM" }, { status: 500 });
    }

    return NextResponse.json({ graph: graphData });
  } catch (error) {
    console.error("Graph generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate graph" },
      { status: 500 }
    );
  }
}
