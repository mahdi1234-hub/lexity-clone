import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, context } = await req.json();

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an AI writing assistant helping with a collaborative document. Complete the user's text naturally and concisely. Only provide the completion text, no explanations or formatting markers. Keep completions to 1-3 sentences.",
        },
        {
          role: "user",
          content: `Context of the document so far:\n${context || ""}\n\nComplete this text:\n${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ completion: text.trim() });
  } catch (error) {
    console.error("AI complete error:", error);
    return NextResponse.json(
      { error: "Failed to generate completion" },
      { status: 500 }
    );
  }
}
