import { Stagehand } from "@browserbasehq/stagehand";

// Stagehand configuration for browser automation agent
// Uses Groq LLM for AI reasoning and Browserbase for cloud browser execution

export interface BrowserAgentStep {
  type: "navigate" | "act" | "extract" | "observe" | "think" | "complete" | "error";
  description: string;
  url?: string;
  data?: unknown;
  screenshot?: string;
  timestamp: string;
}

export interface BrowserAgentResult {
  success: boolean;
  steps: BrowserAgentStep[];
  finalResult: string;
  totalTime: number;
}

// Create a Stagehand instance with Groq LLM
export async function createStagehandInstance(): Promise<Stagehand> {
  const useBrowserbase = !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);

  const stagehand = new Stagehand({
    env: useBrowserbase ? "BROWSERBASE" : "LOCAL",
    ...(useBrowserbase
      ? {
          apiKey: process.env.BROWSERBASE_API_KEY!,
          projectId: process.env.BROWSERBASE_PROJECT_ID!,
        }
      : {
          localBrowserLaunchOptions: {
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          },
        }),
    model: "groq-llama-3.3-70b-versatile",
    verbose: 1,
    disablePino: true,
    disableAPI: true,
  });

  await stagehand.init();
  return stagehand;
}

// Task type classification using Groq
export function classifyTask(task: string): {
  type: "research" | "navigate" | "interact" | "extract" | "workflow" | "search";
  steps: string[];
} {
  const taskLower = task.toLowerCase();

  if (taskLower.includes("research") || taskLower.includes("find information") || taskLower.includes("learn about")) {
    return {
      type: "research",
      steps: [
        "Search for the topic",
        "Navigate to relevant sources",
        "Extract key information",
        "Compile findings",
      ],
    };
  }

  if (taskLower.includes("search") || taskLower.includes("look up") || taskLower.includes("find")) {
    return {
      type: "search",
      steps: [
        "Open search engine",
        "Enter search query",
        "Review results",
        "Extract relevant information",
      ],
    };
  }

  if (taskLower.includes("go to") || taskLower.includes("navigate") || taskLower.includes("open") || taskLower.includes("visit")) {
    return {
      type: "navigate",
      steps: [
        "Navigate to the target URL",
        "Wait for page to load",
        "Extract page content",
      ],
    };
  }

  if (taskLower.includes("click") || taskLower.includes("fill") || taskLower.includes("submit") || taskLower.includes("interact") || taskLower.includes("type")) {
    return {
      type: "interact",
      steps: [
        "Navigate to target page",
        "Identify interactive elements",
        "Perform requested interactions",
        "Verify results",
      ],
    };
  }

  if (taskLower.includes("extract") || taskLower.includes("scrape") || taskLower.includes("get data") || taskLower.includes("collect")) {
    return {
      type: "extract",
      steps: [
        "Navigate to target page",
        "Identify data to extract",
        "Extract structured data",
        "Format and return results",
      ],
    };
  }

  // Default: multi-step workflow
  return {
    type: "workflow",
    steps: [
      "Analyze the task requirements",
      "Plan execution steps",
      "Execute each step sequentially",
      "Compile and return results",
    ],
  };
}
