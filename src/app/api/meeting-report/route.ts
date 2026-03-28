import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient, MODELS } from "@/lib/groq";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { threads, roomId, participants } = await req.json();

    // Build context from collaboration threads
    const threadSummaries = (threads || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any, i: number) => {
        const comments = (t.comments || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => {
            const text =
              c.body?.content?.[0]?.children?.[0]?.text || "No content";
            return `  - ${text}`;
          })
          .join("\n");
        const status = t.metadata?.resolved ? "RESOLVED" : "OPEN";
        return `Thread ${i + 1} [${status}]:\n${comments}`;
      }
    ).join("\n\n");

    const participantList = (participants || []).join(", ") || "Unknown participants";

    const prompt = `You are a professional meeting facilitator and report writer. Based on the following collaboration whiteboard session, generate a comprehensive meeting report with actionable items.

Room: ${roomId || "Collaboration Session"}
Participants: ${participantList}

Discussion Threads:
${threadSummaries || "No discussion threads recorded."}

Generate a structured meeting report in the following JSON format:
{
  "title": "Meeting report title",
  "date": "Current date formatted nicely",
  "summary": "Executive summary of the collaboration session (2-3 paragraphs)",
  "keyDiscussions": [
    {
      "topic": "Discussion topic",
      "summary": "Brief summary of what was discussed",
      "status": "resolved|open|in-progress"
    }
  ],
  "actionItems": [
    {
      "id": 1,
      "action": "Clear actionable task description",
      "priority": "high|medium|low",
      "assignee": "Suggested assignee or 'Team'",
      "deadline": "Suggested timeline"
    }
  ],
  "decisions": ["Key decisions made during the session"],
  "nextSteps": ["Next steps for the team"],
  "risks": ["Any identified risks or concerns"]
}

Be specific, professional, and actionable. If threads are empty, generate a template report acknowledging the whiteboard session occurred.`;

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: MODELS.text,
      messages: [
        { role: "system", content: "You are a professional meeting report generator. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const reportContent = completion.choices[0]?.message?.content || "{}";
    const report = JSON.parse(reportContent);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Meeting report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate meeting report" },
      { status: 500 }
    );
  }
}
