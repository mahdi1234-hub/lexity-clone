import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroqClient, MODELS } from "@/lib/groq";

export const maxDuration = 60;

const GRAPH_ANALYTICS_PROMPT = `You are an expert data scientist specializing in network analysis, graph theory, and ML embeddings.
Given CSV data, you must analyze it and generate a comprehensive graph network structure with analytics.

Your task:
1. Identify entities (nodes) from the CSV columns - each unique value in key columns becomes a node
2. Identify relationships (edges/links) between entities based on co-occurrence, correlation, or explicit relationships in the data
3. Calculate node properties: size (importance/frequency), color category, cluster assignment
4. Generate 2D embedding coordinates for each node using the data relationships (simulate UMAP/t-SNE style layout)
5. Compute graph analytics metrics

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "label": "display name",
      "category": "category_name",
      "size": 1.0,
      "x": 0.0,
      "y": 0.0,
      "properties": {"key": "value"},
      "cluster": 0,
      "degree": 0,
      "pagerank": 0.0
    }
  ],
  "links": [
    {
      "source": "node_id_1",
      "target": "node_id_2",
      "weight": 1.0,
      "label": "relationship_type"
    }
  ],
  "analytics": {
    "totalNodes": 0,
    "totalEdges": 0,
    "density": 0.0,
    "avgDegree": 0.0,
    "maxDegree": 0,
    "clusters": 0,
    "modularity": 0.0,
    "avgPathLength": 0.0,
    "diameter": 0,
    "components": 0,
    "topNodes": [{"id": "node_id", "label": "name", "metric": "pagerank", "value": 0.0}],
    "clusterSizes": [{"cluster": 0, "size": 0, "label": "cluster_name"}],
    "degreeDistribution": [{"degree": 0, "count": 0}],
    "categoryBreakdown": [{"category": "name", "count": 0, "color": "#hex"}]
  },
  "embeddings": {
    "method": "simulated_umap",
    "dimensions": 2,
    "description": "Brief description of what the embedding reveals"
  },
  "summary": "A human-readable summary of the graph analysis findings"
}

Rules:
- Generate at most 500 nodes and 2000 edges for performance
- Use meaningful categories with distinct colors
- Position nodes using simulated force-directed or embedding layout (x,y coordinates between -500 and 500)
- Cluster related nodes together spatially
- Make edge weights reflect relationship strength (0.1 to 1.0)
- Calculate realistic graph metrics
- Provide actionable insights in the summary`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    
    // Limit to first 200 rows for analysis
    const sampleData = lines.slice(0, 201).join("\n");
    const totalRows = lines.length - 1; // minus header

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: MODELS.text,
      messages: [
        { role: "system", content: GRAPH_ANALYTICS_PROMPT },
        {
          role: "user",
          content: `Analyze this CSV data (${totalRows} total rows, showing first 200) and generate a complete graph network with analytics and ML embeddings:\n\n${sampleData}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const graphData = JSON.parse(content);
    
    // Add metadata
    graphData.metadata = {
      filename: file.name,
      totalRows,
      analyzedRows: Math.min(totalRows, 200),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(graphData);
  } catch (error) {
    console.error("Graph analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate graph analytics" },
      { status: 500 }
    );
  }
}
