import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

export const maxDuration = 120;

const taskSchema = z.object({
  task: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id!;

  let body;
  try {
    body = taskSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid task. Please provide a task description." },
      { status: 400 }
    );
  }

  const { task } = body;
  const startTime = Date.now();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendStep = (step: {
        type: string;
        description: string;
        url?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
        timestamp: string;
      }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(step)}\n\n`));
      };

      try {
        // Step 1: Classify the task
        const { classifyTask } = await import("@/lib/stagehand");
        const classification = classifyTask(task);

        sendStep({
          type: "think",
          description: `Analyzing task: "${task}"`,
          timestamp: new Date().toISOString(),
        });

        sendStep({
          type: "think",
          description: `Task classified as "${classification.type}". Planned steps: ${classification.steps.join(" -> ")}`,
          timestamp: new Date().toISOString(),
        });

        // Step 2: Try to initialize Stagehand browser
        sendStep({
          type: "think",
          description: "Initializing browser automation engine with Groq AI...",
          timestamp: new Date().toISOString(),
        });

        let stagehand: Awaited<ReturnType<typeof import("@/lib/stagehand").createStagehandInstance>> | null = null;

        try {
          const { createStagehandInstance } = await import("@/lib/stagehand");
          stagehand = await createStagehandInstance();
        } catch (initError) {
          console.error("Stagehand init error:", initError);
          // Fallback to AI-only mode
          sendStep({
            type: "think",
            description: "Browser engine not available in this environment. Switching to AI-powered analysis mode...",
            timestamp: new Date().toISOString(),
          });

          await runAIFallback(task, classification, sendStep, startTime);
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Step 3: Execute with Stagehand
        try {
          // Try agent mode first for autonomous execution
          sendStep({
            type: "navigate",
            description: "Starting autonomous browser agent...",
            timestamp: new Date().toISOString(),
          });

          const agentInstruction = buildAgentInstruction(task, classification.type);

          const agent = stagehand.agent({
            model: "groq-llama-3.3-70b-versatile",
            systemPrompt: `You are a browser automation agent. Execute tasks precisely and efficiently. Navigate websites, interact with elements, extract data, and complete multi-step workflows autonomously. Always report what you find.`,
          });

          sendStep({
            type: "act",
            description: "Agent initialized. Executing task...",
            timestamp: new Date().toISOString(),
          });

          const agentResult = await agent.execute(agentInstruction);

          sendStep({
            type: "extract",
            description: "Task execution completed. Processing results...",
            data: {
              actions: agentResult.actions,
              message: agentResult.message,
            },
            timestamp: new Date().toISOString(),
          });

          // Get browsing history
          const history = await stagehand.history;
          if (history && history.length > 0) {
            sendStep({
              type: "think",
              description: `Completed ${history.length} browser actions`,
              data: history.map((h) => ({
                method: h.method,
                timestamp: h.timestamp,
              })),
              timestamp: new Date().toISOString(),
            });
          }

          const totalTime = Date.now() - startTime;
          sendStep({
            type: "complete",
            description: agentResult.message || `Browser agent task completed in ${(totalTime / 1000).toFixed(1)}s`,
            data: {
              totalTime,
              mode: "browser-agent",
              stepsExecuted: history?.length || 0,
              actions: agentResult.actions,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (agentError) {
          console.error("Agent execution error:", agentError);

          // Fallback: step-by-step using act/extract/observe
          try {
            sendStep({
              type: "think",
              description: "Switching to step-by-step browser execution...",
              timestamp: new Date().toISOString(),
            });

            await runStepByStep(stagehand, task, classification.type, sendStep, startTime);
          } catch (stepError) {
            console.error("Step-by-step error:", stepError);
            sendStep({
              type: "error",
              description: `Browser execution encountered an issue. Falling back to AI analysis...`,
              timestamp: new Date().toISOString(),
            });
            await runAIFallback(task, classification, sendStep, startTime);
          }
        } finally {
          try {
            await stagehand.close();
          } catch {
            // Ignore close errors
          }
        }
      } catch (error) {
        console.error("Browser agent error:", error);
        sendStep({
          type: "error",
          description: `An error occurred: ${(error as Error).message}`,
          timestamp: new Date().toISOString(),
        });
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Build agent instruction based on task type
function buildAgentInstruction(task: string, taskType: string): string {
  switch (taskType) {
    case "research":
      return `Research the following topic. Go to Google (google.com), search for it, visit the most relevant results, and compile a comprehensive summary of key findings. Topic: ${task}`;
    case "search":
      return `Search the web for this query. Go to Google (google.com), search for it, and extract the top results with titles, URLs, and descriptions. Query: ${task}`;
    case "navigate":
      return `Navigate to the specified website, wait for it to load, and extract the main content. Task: ${task}`;
    case "interact":
      return `Interact with the website as instructed. Navigate to the target, find the right elements, and perform the requested actions. Task: ${task}`;
    case "extract":
      return `Extract the requested data. Navigate to the source, identify the data, and return it in a structured format. Task: ${task}`;
    default:
      return `Complete this multi-step task autonomously. Plan your approach, execute each step, and compile results. Task: ${task}`;
  }
}

// Step-by-step fallback using individual Stagehand operations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runStepByStep(stagehand: any, task: string, taskType: string, sendStep: (step: { type: string; description: string; url?: string; data?: unknown; timestamp: string }) => void, startTime: number) {
  const searchQuery = task.replace(/^(search for|research|find|look up|go to|navigate to|open|visit)\s*/i, "").trim();

  // Step 1: Navigate to Google
  sendStep({
    type: "navigate",
    description: "Navigating to Google...",
    url: "https://www.google.com",
    timestamp: new Date().toISOString(),
  });

  await stagehand.act("Navigate to https://www.google.com");
  await new Promise((resolve: (v: unknown) => void) => setTimeout(resolve, 1500));

  // Step 2: Search
  sendStep({
    type: "act",
    description: `Searching for: "${searchQuery}"`,
    timestamp: new Date().toISOString(),
  });

  await stagehand.act(`Type "${searchQuery}" into the Google search box and press Enter`);
  await new Promise((resolve: (v: unknown) => void) => setTimeout(resolve, 2000));

  // Step 3: Observe the page
  sendStep({
    type: "observe",
    description: "Analyzing search results...",
    timestamp: new Date().toISOString(),
  });

  const observations = await stagehand.observe("Identify all search result links on this page");

  sendStep({
    type: "observe",
    description: `Found ${observations.length} elements on the page`,
    data: observations.slice(0, 5).map((o: { description: string }) => o.description),
    timestamp: new Date().toISOString(),
  });

  // Step 4: Extract search results
  sendStep({
    type: "extract",
    description: "Extracting search result data...",
    timestamp: new Date().toISOString(),
  });

  const searchResults = await stagehand.extract(
    "Extract all search result titles, URLs, and descriptions",
    z.object({
      results: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          description: z.string(),
        })
      ),
    })
  );

  sendStep({
    type: "extract",
    description: `Extracted ${searchResults.results?.length || 0} results`,
    data: searchResults,
    timestamp: new Date().toISOString(),
  });

  // Step 5: Visit first result for more details
  if (taskType === "research" && observations.length > 0) {
    sendStep({
      type: "act",
      description: "Visiting top result for detailed information...",
      timestamp: new Date().toISOString(),
    });

    try {
      await stagehand.act("Click on the first search result link");
      await new Promise((resolve: (v: unknown) => void) => setTimeout(resolve, 2000));

      const pageContent = await stagehand.extract(
        "Extract the main content, title, key points, and summary from this page"
      );

      sendStep({
        type: "extract",
        description: "Extracted detailed content from top result",
        data: pageContent,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Non-fatal
    }
  }

  const totalTime = Date.now() - startTime;
  sendStep({
    type: "complete",
    description: `Task completed in ${(totalTime / 1000).toFixed(1)}s`,
    data: {
      totalTime,
      mode: "step-by-step",
      searchResults,
      observations: observations.length,
    },
    timestamp: new Date().toISOString(),
  });
}

// AI-only fallback when browser is not available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAIFallback(task: string, classification: any, sendStep: (step: { type: string; description: string; url?: string; data?: unknown; timestamp: string }) => void, startTime: number) {
  const { getGroqClient } = await import("@/lib/groq");
  const groq = getGroqClient();

  sendStep({
    type: "think",
    description: "Processing task with AI analysis...",
    timestamp: new Date().toISOString(),
  });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are an advanced AI browser automation agent. The user asked you to perform a web task. Since the browser is not available, provide a comprehensive AI-powered response based on your knowledge.

For research: Provide detailed, well-organized information with sources.
For search: List what you know about the subject with key facts.
For navigation: Describe what the user would find at the target.
For interaction: Explain how the interaction would work.
For extraction: Provide any known data about the target.
For workflow: Break down and address each step.

Format with clear sections, bullet points, and be thorough.`,
      },
      {
        role: "user",
        content: `Task: ${task}\nClassification: ${classification.type}\nSteps: ${classification.steps.join(", ")}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const aiResult = completion.choices[0]?.message?.content || "Unable to process task.";

  sendStep({
    type: "extract",
    description: "AI analysis complete",
    data: { analysis: aiResult, mode: "ai-analysis" },
    timestamp: new Date().toISOString(),
  });

  const totalTime = Date.now() - startTime;
  sendStep({
    type: "complete",
    description: aiResult,
    data: { totalTime, mode: "ai-analysis", classification: classification.type },
    timestamp: new Date().toISOString(),
  });
}
