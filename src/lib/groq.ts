import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function createEmbedding(text: string): Promise<number[]> {
  // Use a simple hash-based embedding since Groq doesn't support embeddings
  // We'll create a deterministic 1536-dim vector from the text
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    embedding[i % 1536] += charCode / 1000;
    embedding[(i * 7 + 3) % 1536] += Math.sin(charCode) * 0.1;
    embedding[(i * 13 + 7) % 1536] += Math.cos(charCode) * 0.1;
  }
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  return embedding;
}

export async function chatCompletion(
  messages: { role: string; content: string }[],
  stream: boolean = true
) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    stream,
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response;
}

export { groq };
