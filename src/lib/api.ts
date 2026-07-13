import axios, { AxiosError } from "axios";
import type {
  ChatDetailResponse,
  ChatSummary,
  ChunkMessagesResponse,
  QueryStreamEvent,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Must match `QueryRequest.question`'s `max_length` in
// `backend/app/models/schemas.py` - kept as a constant here (rather than
// fetched from the backend) so the UI can enforce/display the limit
// without an extra round trip.
export const MAX_QUESTION_LENGTH = 1000;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(err: unknown): ApiError {
  const axiosErr = err as AxiosError<{ detail?: string; message?: string }>;
  if (axiosErr.isAxiosError) {
    const status = axiosErr.response?.status ?? 0;
    const message =
      axiosErr.response?.data?.detail ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      `Request failed with status ${status}`;
    return new ApiError(message, status);
  }
  return new ApiError((err as Error)?.message ?? "Unknown error", 0);
}

// The backend streams the answer as newline-delimited JSON (see
// `POST /chat/query` in `backend/app/api/routes/chat.py`), so this uses
// `fetch`'s readable stream directly rather than axios, which buffers the
// whole response body before resolving.
export async function* streamQuery(
  sessionId: string,
  chatId: string,
  question: string,
  topK = 4,
): AsyncGenerator<QueryStreamEvent> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/chat/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        chat_id: chatId,
        question,
        top_k: topK,
      }),
    });
  } catch (err) {
    throw new ApiError(
      (err as Error)?.message ?? "Failed to reach the backend.",
      0,
    );
  }

  if (!res.ok || !res.body) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch {
      // Error body wasn't JSON - keep the default message.
    }
    throw new ApiError(message, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) yield JSON.parse(line) as QueryStreamEvent;
    }
  }

  const trailing = buffer.trim();
  if (trailing) yield JSON.parse(trailing) as QueryStreamEvent;
}

export async function listChats(sessionId: string): Promise<ChatSummary[]> {
  try {
    const res = await api.get<ChatSummary[]>("/chat/list", {
      params: { session_id: sessionId },
    });
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getChatDetail(
  chatId: string,
): Promise<ChatDetailResponse> {
  try {
    const res = await api.get<ChatDetailResponse>(`/chat/${chatId}`);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function getChunkMessages(
  chunkId: string,
): Promise<ChunkMessagesResponse> {
  try {
    const res = await api.get<ChunkMessagesResponse>(`/chat/chunk/${chunkId}`);
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await api.get("/health");
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
