import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const PRODUCT_GUIDE_PROMPT = `You are a friendly product guide assistant for Lexity, an intelligent AI-powered platform. You help visitors understand what the product can do. Keep responses concise (2-3 sentences max).

Key features you can talk about:
- Memory-powered AI conversations that remember context across sessions
- Multi-format file analysis (PDF, DOCX, CSV, images, videos)
- Exploratory Data Analysis (EDA) with interactive dashboards and 21+ chart types
- Full AutoML pipeline powered by PyCaret (classification, regression, clustering, anomaly detection, time series)
- Knowledge graphs from conversations
- Geospatial visualization with Deck.gl and Kepler.gl (heatmaps, arcs, 3D columns, etc.)
- Solar analytics and site analysis for any location
- Interactive forms and surveys inline in chat
- Web search with AI-powered answers
- ElevenLabs voice agent for hands-free interaction
- Real-time multiplayer collaboration with whiteboard, comments, and annotations
- Inline diagram generation (flowcharts, mind maps, timelines, bar/line/pie charts, etc.)
- Report generation with PDF export
- Private and secure - each user has isolated memory

Always encourage visitors to sign in with Google to try it out. Be enthusiastic but professional.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { reply: "Thanks for your interest! Sign in with Google to explore all our AI-powered features including memory, file analysis, AutoML, geospatial maps, and more." },
        { status: 200 }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PRODUCT_GUIDE_PROMPT },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    const reply = completion.choices?.[0]?.message?.content || "Sign in with Google to explore all our features!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Product guide error:", error);
    return NextResponse.json(
      { reply: "I'd love to tell you more! Sign in with Google to experience our full AI platform with memory, analytics, maps, and collaboration tools." },
      { status: 200 }
    );
  }
}
