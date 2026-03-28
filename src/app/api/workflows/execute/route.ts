import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient, MODELS } from "@/lib/groq";

export const maxDuration = 60;

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    nodeType: string;
    label: string;
    params: Record<string, unknown>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Execute workflow using AI to simulate geospatial operations
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { nodes, edges } = (await req.json()) as {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    };

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({ error: "No nodes in workflow" }, { status: 400 });
    }

    // Build execution order (topological sort)
    const executionOrder = topologicalSort(nodes, edges);

    // Build workflow description for AI
    const workflowDescription = buildWorkflowDescription(executionOrder, edges);

    // Use Groq AI to analyze and generate results
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: MODELS.text,
      messages: [
        {
          role: "system",
          content: `You are a geospatial analytics engine that executes workflow pipelines. When given a workflow description, you must:
1. Analyze each step in the pipeline
2. Generate realistic sample data and results for each node
3. Return a JSON object with results for each node

For spatial operations, generate realistic GeoJSON features with coordinates.
For aggregations, generate summary statistics.
For filters, describe what data would pass through.
For joins, describe the merged result structure.

IMPORTANT: Your response must be ONLY valid JSON, no markdown, no explanation. Format:
{
  "results": {
    "<node_id>": {
      "status": "success" | "error",
      "rowCount": number,
      "columns": ["col1", "col2"],
      "sampleData": [{"col1": "val1", "col2": "val2"}],
      "summary": "Brief description of what this node produced",
      "geojson": { "type": "FeatureCollection", "features": [...] } // Only for spatial outputs
    }
  },
  "finalOutput": {
    "summary": "Overall workflow result summary",
    "totalRows": number,
    "executionTime": "estimated time"
  }
}`
        },
        {
          role: "user",
          content: `Execute this geospatial workflow pipeline:\n\n${workflowDescription}`
        }
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const aiContent = response.choices[0]?.message?.content || "{}";

    // Try to parse AI response as JSON
    let results;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      results = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      // If AI didn't return valid JSON, wrap the text response
      results = {
        results: {},
        finalOutput: {
          summary: aiContent,
          totalRows: 0,
          executionTime: "N/A"
        }
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute workflow" },
      { status: 500 }
    );
  }
}

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
    nodeMap.set(n.id, n);
  });

  edges.forEach((e) => {
    adjacency.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted: WorkflowNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);
    adjacency.get(id)?.forEach((target) => {
      const newDeg = (inDegree.get(target) || 1) - 1;
      inDegree.set(target, newDeg);
      if (newDeg === 0) queue.push(target);
    });
  }

  // Add any remaining nodes not in the graph
  nodes.forEach((n) => {
    if (!sorted.find((s) => s.id === n.id)) {
      sorted.push(n);
    }
  });

  return sorted;
}

function buildWorkflowDescription(nodes: WorkflowNode[], edges: WorkflowEdge[]): string {
  let desc = "WORKFLOW PIPELINE:\n\n";

  nodes.forEach((node, i) => {
    const incoming = edges.filter((e) => e.target === node.id);
    const outgoing = edges.filter((e) => e.source === node.id);

    desc += `Step ${i + 1}: [${node.data.nodeType}] "${node.data.label}"\n`;
    desc += `  Node ID: ${node.id}\n`;

    if (Object.keys(node.data.params || {}).length > 0) {
      desc += `  Parameters: ${JSON.stringify(node.data.params)}\n`;
    }

    if (incoming.length > 0) {
      desc += `  Inputs from: ${incoming.map((e) => e.source).join(", ")}\n`;
    }
    if (outgoing.length > 0) {
      desc += `  Outputs to: ${outgoing.map((e) => e.target).join(", ")}\n`;
    }
    desc += "\n";
  });

  return desc;
}
