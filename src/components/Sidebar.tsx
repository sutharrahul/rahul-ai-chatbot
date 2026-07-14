import AssistantAvatar from "./AssistantAvatar";
import StatusBadge from "./StatusBadge";
import type { ChatSummary } from "@/lib/types";

// Buckets a session's chats (already limited to the last 7 days by the
// backend, see `list_recent_chats` in `backend/app/db/db_query.py`) into
// the day-based groups the sidebar renders under.
function groupChatsByDay(
  chats: ChatSummary[],
): { label: string; chats: ChatSummary[] }[] {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());

  const buckets: Record<string, ChatSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
  };

  for (const chat of chats) {
    const diffDays = Math.round(
      (today - startOfDay(new Date(chat.created_at))) / 86_400_000,
    );
    if (diffDays <= 0) buckets.Today.push(chat);
    else if (diffDays === 1) buckets.Yesterday.push(chat);
    else if (diffDays <= 7) buckets["Previous 7 Days"].push(chat);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, chats: list }));
}

interface SidebarProps {
  chatHistory: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  // Mobile overlay drawer visibility.
  open: boolean;
  onClose: () => void;
  // Desktop collapse state - independent of `open`/`onClose` above, which
  // only ever apply to the mobile drawer. Kept separate (rather than one
  // flag driving both) so a viewport resize can't leave the sidebar stuck
  // closed on desktop just because it was dismissed on mobile, or vice
  // versa.
  desktopOpen: boolean;
  onCloseDesktop: () => void;
  online: boolean | null;
  // True while the assistant is generating a response - suggestion
  // buttons are disabled during that window so a click can't fire a
  // second, overlapping request (see `ChatPage.send`'s matching guard).
  disabled?: boolean;
}

export default function Sidebar({
  chatHistory,
  activeChatId,
  onSelectChat,
  onNewChat,
  open,
  onClose,
  desktopOpen,
  onCloseDesktop,
  online,
  disabled,
}: SidebarProps) {
  const handleSelectChat = (chatId: string) => {
    if (disabled) return;
    onSelectChat(chatId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const groupedHistory = groupChatsByDay(chatHistory);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-50 transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-neutral-950 md:static md:z-auto md:max-w-none md:translate-x-0 md:transition-[width,opacity] md:duration-300 md:ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${
          desktopOpen
            ? "md:w-64 md:opacity-100"
            : "md:w-0 md:border-r-0 md:opacity-0 md:pointer-events-none"
        }`}
      >
        {/* Fixed-width inner column, independent of the outer `<aside>`'s
            collapsing width - the outer element's `overflow-hidden` clips
            this uniformly as it animates, rather than every section inside
            needing its own width override. */}
        <div className="flex h-full w-72 flex-col md:w-64">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-4">
            <div className="flex items-center gap-2">
              <AssistantAvatar className="h-12 w-12" size={64} />
              <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                Rahul Suthar
              </span>
            </div>
            {/* <button
              type="button"
              onClick={() => {
                onClose();
                onCloseDesktop();
              }}
              aria-label="Close sidebar"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-white/10"
            >
              <CloseIcon className="h-4 w-4" />
            </button> */}
          </div>

          <div className="shrink-0 px-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100 dark:border-white/10 dark:bg-white/5 dark:text-neutral-100 dark:hover:bg-white/10"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New Chat
            </button>
          </div>

          {/* No padding/margin on the scroll container itself - see the
              matching comment in `app/page.tsx` for why that's required for
              the custom scrollbar thumb to reach the track's top/bottom. */}
          <div className="styled-scrollbar min-h-0 flex-1 overflow-y-auto">
            <div className="mt-6 px-3">
              {groupedHistory.length === 0 ? (
                <p className="px-2 text-xs text-neutral-400 dark:text-neutral-500">
                  No chats in the last 7 days
                </p>
              ) : (
                groupedHistory.map((group) => (
                  <div key={group.label} className="mb-4 last:mb-0">
                    <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                      {group.label}
                    </p>
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {group.chats.map((chat) => {
                        const active = chat.chat_id === activeChatId;
                        return (
                          <li key={chat.chat_id}>
                            <button
                              type="button"
                              onClick={() => handleSelectChat(chat.chat_id)}
                              disabled={disabled}
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
                                active
                                  ? "bg-neutral-100 text-neutral-900 dark:bg-white/10 dark:text-white"
                                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white dark:disabled:hover:bg-transparent"
                              }`}
                            >
                              <ChatBubbleIcon className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                              <span className="truncate">{chat.chat_title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-neutral-200 px-4 py-3 dark:border-white/10">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Server
            </p>
            <StatusBadge online={online} />
          </div>
        </div>
      </aside>
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 6 6 18M6 6l12 12"
      />
    </svg>
  );
}
