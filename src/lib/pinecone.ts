import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = "multitenant-memory";
const DIMENSION = 1536;

let indexReady = false;

async function ensureIndex() {
  if (indexReady) return;
  try {
    const list = await pc.listIndexes();
    const exists = list.indexes?.some((idx) => idx.name === INDEX_NAME);
    if (!exists) {
      await pc.createIndex({
        name: INDEX_NAME,
        dimension: DIMENSION,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      });
      // Wait for index to be ready
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    indexReady = true;
  } catch (error) {
    console.error("Error ensuring index:", error);
    indexReady = true; // Don't block on error, index might already exist
  }
}

export async function getIndex() {
  await ensureIndex();
  return pc.index(INDEX_NAME);
}

export async function upsertMemory(
  userId: string,
  conversationId: string,
  messageId: string,
  embedding: number[],
  metadata: {
    role: string;
    content: string;
    conversationId: string;
    timestamp: string;
  }
) {
  try {
    if (!embedding || embedding.length !== DIMENSION) {
      console.error("Invalid embedding dimension:", embedding?.length);
      return;
    }

    const index = await getIndex();
    const namespace = `user_${userId}`;

    const record = {
      id: `${conversationId}_${messageId}`,
      values: embedding,
      metadata: {
        ...metadata,
        userId,
      },
    };

    await index.namespace(namespace).upsert({ records: [record] });
  } catch (error) {
    console.error("Upsert memory error:", error);
  }
}

export async function queryMemory(
  userId: string,
  embedding: number[],
  topK: number = 5,
  conversationId?: string
) {
  const index = await getIndex();
  const namespace = `user_${userId}`;

  try {
    const filter = conversationId
      ? { conversationId: { $eq: conversationId } }
      : undefined;

    const results = await index.namespace(namespace).query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter,
    });

    return results.matches || [];
  } catch (error) {
    console.error("Error querying memory:", error);
    return [];
  }
}

export async function getConversationMessages(
  userId: string,
  conversationId: string
) {
  const index = await getIndex();
  const namespace = `user_${userId}`;

  try {
    const results = await index.namespace(namespace).query({
      vector: new Array(DIMENSION).fill(0),
      topK: 100,
      includeMetadata: true,
      filter: { conversationId: { $eq: conversationId } },
    });

    const messages = (results.matches || [])
      .filter((m) => m.metadata)
      .map((m) => ({
        id: m.id,
        role: m.metadata!.role as string,
        content: m.metadata!.content as string,
        timestamp: m.metadata!.timestamp as string,
      }))
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    return messages;
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    return [];
  }
}

export async function listUserConversations(userId: string) {
  const index = await getIndex();
  const namespace = `user_${userId}`;

  try {
    const results = await index.namespace(namespace).query({
      vector: new Array(DIMENSION).fill(0),
      topK: 1000,
      includeMetadata: true,
    });

    const conversationMap = new Map<
      string,
      { id: string; lastMessage: string; timestamp: string }
    >();

    (results.matches || []).forEach((m) => {
      if (m.metadata) {
        const convId = m.metadata.conversationId as string;
        const existing = conversationMap.get(convId);
        const ts = m.metadata.timestamp as string;
        if (
          !existing ||
          new Date(ts).getTime() > new Date(existing.timestamp).getTime()
        ) {
          conversationMap.set(convId, {
            id: convId,
            lastMessage:
              (m.metadata.content as string).substring(0, 100) + "...",
            timestamp: ts,
          });
        }
      }
    });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error listing conversations:", error);
    return [];
  }
}

export async function deleteConversation(
  userId: string,
  conversationId: string
) {
  const index = await getIndex();
  const namespace = `user_${userId}`;

  try {
    // Query all messages in this conversation to get their IDs
    const results = await index.namespace(namespace).query({
      vector: new Array(DIMENSION).fill(0),
      topK: 1000,
      includeMetadata: true,
      filter: { conversationId: { $eq: conversationId } },
    });

    const ids = (results.matches || []).map((m) => m.id);
    if (ids.length > 0) {
      await index.namespace(namespace).deleteMany(ids);
    }
  } catch (error) {
    console.error("Error deleting conversation:", error);
  }
}
