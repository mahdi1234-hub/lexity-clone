import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/collaboration-auth",
});

// Presence: what each user broadcasts to others in real time
type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
  avatar?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
// Storage: shared data structures persisted on the server
type Storage = Record<string, never>;

// User metadata from the auth endpoint
type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
    color: string;
  };
};

// Room event types
type RoomEvent = {
  type: "COMMENT_ADDED" | "REACTION_ADDED";
  userId: string;
  message?: string;
};

// Thread metadata for comments
type ThreadMetadata = {
  x: number;
  y: number;
  resolved: boolean;
  zIndex: number;
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useStorage,
  useMutation,
  useThreads,
  useCreateThread,
  useCreateComment,
  useEditComment,
  useDeleteComment,
  useEditThreadMetadata,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
  client
);
