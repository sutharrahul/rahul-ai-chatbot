import AssistantAvatar from "./AssistantAvatar";

interface SidebarProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onNewChat: () => void;
  open: boolean;
  onClose: () => void;
  // True while the assistant is generating a response - suggestion
  // buttons are disabled during that window so a click can't fire a
  // second, overlapping request (see `ChatPage.send`'s matching guard).
  disabled?: boolean;
}

export default function Sidebar({
  suggestions,
  onSelect,
  onNewChat,
  open,
  onClose,
  disabled,
}: SidebarProps) {
  const handleSelect = (suggestion: string) => {
    if (disabled) return;
    onSelect(suggestion);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-neutral-950 md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0 md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <AssistantAvatar className="h-8 w-8" size={32} />
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
              Rahul Suthar
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-200/60 md:hidden dark:text-neutral-400 dark:hover:bg-white/10"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
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
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
              Suggested
            </p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    disabled={disabled}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white dark:disabled:hover:bg-transparent"
                  >
                    <ChatBubbleIcon className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                    <span className="truncate">{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
