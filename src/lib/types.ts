export type ChatRole = "user" | "assistant";

export interface Source {
  document_id: string;
  filename: string;
  chunk_index: number;
  content: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: Source[];
  createdAt: number;
}

// One line of the `POST /chat/query` stream (see `app/models/schemas.py`'s
// TokenEvent/DoneEvent/ErrorEvent) - "token" arrives once per answer chunk,
// then exactly one "done" (success) or "error" (failure) ends the stream.
export type QueryStreamEvent =
  | { type: "token"; content: string }
  | { type: "done"; chat_id: string; chat_title: string | null; sources: Source[] }
  | { type: "error"; message: string };

export interface ChatHistoryMessage {
  role: ChatRole;
  message: string;
  created_at: string;
}

// `chat_title` is always a non-empty string here - the backend's
// `list_recent_chats` (see `app/db/db_query.py`) excludes untitled chats.
export interface ChatSummary {
  chat_id: string;
  chat_title: string;
  created_at: string;
}

// `previous_chunk_id` is set when the conversation has older messages not
// included here - pass it to `getChunkMessages` to load them.
export interface ChatDetailResponse {
  chat_id: string;
  chat_title: string | null;
  messages: ChatHistoryMessage[];
  previous_chunk_id: string | null;
}

// Response for loading one older chunk of a conversation (see
// `getChunkMessages` in `lib/api.ts`) - `previous_chunk_id` is set if
// there's still an even older chunk to load.
export interface ChunkMessagesResponse {
  messages: ChatHistoryMessage[];
  previous_chunk_id: string | null;
}
