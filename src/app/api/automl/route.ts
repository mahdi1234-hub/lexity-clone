import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 120;

const PYCARET_API_URL = process.env.PYCARET_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Forward file upload
      const formData = await req.formData();
      const action = formData.get("action") as string;

      let endpoint = "/upload";
      if (action) {
        endpoint = `/automl/${action}`;
        formData.delete("action");
      }

      const response = await fetch(`${PYCARET_API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }
      return NextResponse.json(data);
    } else {
      // JSON body
      const body = await req.json();
      const { action, ...params } = body;

      let endpoint = `/automl/${action}`;
      let method = "POST";

      if (action === "get_models") {
        endpoint = `/automl/models/${params.task_type}`;
        method = "GET";
      }

      if (method === "GET") {
        const response = await fetch(`${PYCARET_API_URL}${endpoint}`);
        const data = await response.json();
        return NextResponse.json(data);
      }

      // Convert params to FormData for the Python backend
      const formData = new FormData();
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }

      const response = await fetch(`${PYCARET_API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("AutoML proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AutoML service" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const taskType = searchParams.get("task_type");

    if (action === "health") {
      const response = await fetch(`${PYCARET_API_URL}/health`);
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (action === "models" && taskType) {
      const response = await fetch(`${PYCARET_API_URL}/automl/models/${taskType}`);
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("AutoML GET error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AutoML service" },
      { status: 500 }
    );
  }
}
