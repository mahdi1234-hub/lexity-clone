import Groq from "groq-sdk";

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const MODELS = {
  text: "llama-3.3-70b-versatile",
  vision: "meta-llama/llama-4-scout-17b-16e-instruct",
} as const;

export function getGroqClient(): Groq {
  return groqClient;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    embedding[i % 1536] += charCode / 1000;
    embedding[(i * 7 + 3) % 1536] += Math.sin(charCode) * 0.1;
    embedding[(i * 13 + 7) % 1536] += Math.cos(charCode) * 0.1;
  }
  const magnitude = Math.sqrt(
    embedding.reduce((sum: number, val: number) => sum + val * val, 0)
  );
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
  const response = await groqClient.chat.completions.create({
    model: MODELS.text,
    messages: messages as Groq.Chat.Completions.ChatCompletionMessageParam[],
    stream,
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response;
}

export { groqClient };
