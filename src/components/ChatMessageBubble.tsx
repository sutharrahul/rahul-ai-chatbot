import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import AssistantAvatar from "./AssistantAvatar";

// Sources are still returned by the API (see `message.sources`) but are
// intentionally not rendered here - the assistant should read as a plain
// answer, without exposing retrieved chunk/document internals to visitors.
// Re-introduce `<SourcesList sources={message.sources} />` (see
// `SourcesList.tsx`) if that's wanted again later.
export default function ChatMessageBubble({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  // True while this message is still receiving tokens (see `send` in
  // `app/page.tsx`) - renders a blinking cursor after the text.
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-center gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <AssistantAvatar className="h-10 w-10" size={48} />}
      <div
        className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
          isUser
            ? "whitespace-pre-wrap bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : "border border-neutral-200 bg-white text-neutral-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-100"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          // Markdown, not plain text - the model's answers are grounded in
          // markdown-formatted source content (see `data/seed/about_rahul.md`)
          // and naturally echo that formatting (bold, bullet lists, etc.).
          // `prose` (Tailwind Typography) styles the rendered output;
          // `prose-p:last:mb-0` drops the last paragraph's bottom margin so
          // the streaming cursor below sits close to the final line instead
          // of visibly detached below it.
          <div className="prose prose-sm prose-neutral max-w-none dark:prose-invert prose-p:last:mb-0 prose-pre:overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-current align-middle" />
        )}
      </div>
    </div>
  );
}
