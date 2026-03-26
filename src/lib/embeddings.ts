export async function generateEmbedding(text: string): Promise<number[]> {
  const dimension = 384;
  const vector = new Array(dimension).fill(0);

  const normalized = text.toLowerCase().trim();
  if (!normalized) return vector;

  // Character frequency hashing into first 128 slots
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i) % 128;
    vector[code] += 1;
  }

  // Bigram hashing into slots 128-255
  for (let i = 0; i < normalized.length - 1; i++) {
    const bigram =
      (normalized.charCodeAt(i) * 31 + normalized.charCodeAt(i + 1)) % 128;
    vector[128 + bigram] += 1;
  }

  // Trigram hashing into slots 256-383
  for (let i = 0; i < normalized.length - 2; i++) {
    const trigram =
      (normalized.charCodeAt(i) * 31 * 31 +
        normalized.charCodeAt(i + 1) * 31 +
        normalized.charCodeAt(i + 2)) %
      128;
    vector[256 + trigram] += 1;
  }

  const magnitude = Math.sqrt(
    vector.reduce((sum: number, val: number) => sum + val * val, 0)
  );
  if (magnitude > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] = vector[i] / magnitude;
    }
  }

  return vector;
}

export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  if (!text || text.length === 0) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
}
