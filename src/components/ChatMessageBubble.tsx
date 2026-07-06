import type { ChatMessage } from "@/lib/types";
import AssistantAvatar from "./AssistantAvatar";

// Sources are still returned by the API (see `message.sources`) but are
// intentionally not rendered here - the assistant should read as a plain
// answer, without exposing retrieved chunk/document internals to visitors.
// Re-introduce `<SourcesList sources={message.sources} />` (see
// `SourcesList.tsx`) if that's wanted again later.
export default function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-center gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <AssistantAvatar className="h-9 w-9" size={36} />}
      <div
        className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "border border-neutral-200 bg-white text-neutral-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
