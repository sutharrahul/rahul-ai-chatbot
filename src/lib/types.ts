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

export interface QueryResponse {
  answer: string;
  sources: Source[];
}
