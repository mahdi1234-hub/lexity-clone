import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import { initEdgeStoreClient } from "@edgestore/server/core";

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket({
    maxSize: 1024 * 1024 * 50, // 50MB
  }),
  userFiles: es.fileBucket({
    maxSize: 1024 * 1024 * 50, // 50MB
  }),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export type EdgeStoreRouter = typeof edgeStoreRouter;

export const backendClient = initEdgeStoreClient({
  router: edgeStoreRouter,
});
