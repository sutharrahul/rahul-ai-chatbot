import type { QueryResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Must match `QueryRequest.question`'s `max_length` in
// `backend/app/models/schemas.py` - kept as a constant here (rather than
// fetched from the backend) so the UI can enforce/display the limit
// without an extra round trip.
export const MAX_QUESTION_LENGTH = 1000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && (body.detail || body.message)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export async function queryRag(
  question: string,
  topK = 4,
): Promise<QueryResponse> {
  const res = await fetch(`${API_URL}/api/chat/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, top_k: topK }),
  });
  return handleResponse<QueryResponse>(res);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
