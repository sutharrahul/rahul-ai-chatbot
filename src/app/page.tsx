"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import AssistantAvatar from "@/components/AssistantAvatar";
import ChatInput from "@/components/ChatInput";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import HelpButton from "@/components/HelpButton";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import ThemeSwitch from "@/components/ThemeSwitch";
import {
  checkHealth,
  getChatDetail,
  getChunkMessages,
  listChats,
  streamQuery,
  ApiError,
} from "@/lib/api";
import type { ChatHistoryMessage, ChatMessage, ChatSummary } from "@/lib/types";
import { profile } from "@/lib/assistant";
import { v4 as uuidv4 } from "uuid";

const SUGGESTIONS = [
  "Tell me about yourself",
  "What are your skills?",
  "Tell me about your experience",
  "What projects have you built?"
];

// Identifies this browser across reloads (see `session_id` on `Chat` in
// `backend/app/db/schema_modal.py`) - generated once and kept in
// localStorage so a reload can look up the same session's chat history.
const SESSION_STORAGE_KEY = "rag_session_id";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function timestamp() {
  return Date.now();
}

function toChatMessages(historyMessages: ChatHistoryMessage[]): ChatMessage[] {
  return historyMessages.map((m) => ({
    id: makeId(),
    role: m.role,
    content: m.message,
    createdAt: new Date(m.created_at).getTime(),
  }));
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  // Mobile overlay drawer - starts closed so it doesn't cover the chat on
  // small screens where it renders as a full backdrop.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse - independent of the mobile drawer above. Starts open
  // so the sidebar is visible by default in a normal browser view.
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  // sessionId identifies this browser and persists across reloads (see
  // SESSION_STORAGE_KEY above). chatId identifies one conversation - it's
  // regenerated on "New Chat" so the backend starts a fresh chat record
  // instead of appending to the old one. Both start `null` until the
  // mount effect below resolves them (localStorage isn't available during
  // server rendering).
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  // The session's chats from the last 7 days, for the sidebar's grouped
  // history list (see `GET /chat/list` in `backend/app/api/routes/chat.py`).
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
  // Id of the assistant message currently receiving tokens, if any - drives
  // the blinking cursor in `ChatMessageBubble`.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  // Id of the chunk before the oldest one currently loaded, or `null` if
  // there's nothing older (see `previous_chunk_id` in
  // `backend/app/models/schemas.py`) - drives auto-loading older messages
  // on scroll (see `handleScroll`).
  const [previousChunkId, setPreviousChunkId] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Shows/hides the "scroll to bottom" button - true once the user has
  // scrolled away from the bottom.
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Set just before prepending older messages so the scroll effect below
  // can anchor the viewport to the same content instead of jumping to the
  // bottom (its default behavior on any other `messages` change).
  const prependAnchorRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  // Updated imperatively by `handleScroll` (not state - reading it must
  // never be stale) so new tokens only auto-scroll the view when the user
  // was already at the bottom, instead of yanking them down while they're
  // reading older messages.
  const stickToBottomRef = useRef(true);
  // Marks the top of the loaded message list - watched by an
  // IntersectionObserver (below) so older messages auto-load both on
  // scroll AND when a short conversation doesn't fill the viewport at all
  // (nothing to scroll, so a scroll-event-based trigger would never fire).
  const topSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth().then(setOnline);
  }, []);

  // Resolve the persisted session_id and load the sidebar's history list.
  // A reload always starts a fresh chat rather than reopening the
  // session's last one - history stays one click away in the sidebar
  // instead of being auto-opened.
  useEffect(() => {
    let sid = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(sid);
    setChatId(uuidv4());

    listChats(sid)
      .then(setChatHistory)
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  // Runs before paint (useLayoutEffect, not useEffect) so an anchor
  // restore below never flashes the wrong scroll position first.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prependAnchorRef.current) {
      // Older messages were just prepended (see `loadOlderMessages`) -
      // keep the viewport anchored to the same content rather than
      // jumping to the bottom or staying at the now-wrong scrollTop.
      const { scrollHeight: oldHeight, scrollTop: oldTop } =
        prependAnchorRef.current;
      el.scrollTop = oldTop + (el.scrollHeight - oldHeight);
      prependAnchorRef.current = null;
      return;
    }

    // Only follow new content to the bottom if the user was already
    // there - otherwise a token arriving while they're reading older
    // messages would yank the view down.
    if (stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const loadOlderMessages = useCallback(async () => {
    if (!previousChunkId || loadingOlder) return;
    setLoadingOlder(true);

    const el = scrollRef.current;
    if (el) {
      prependAnchorRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
    }

    try {
      const chunk = await getChunkMessages(previousChunkId);
      setMessages((prev) => [...toChatMessages(chunk.messages), ...prev]);
      setPreviousChunkId(chunk.previous_chunk_id);
    } catch {
      prependAnchorRef.current = null;
    } finally {
      setLoadingOlder(false);
    }
  }, [previousChunkId, loadingOlder]);

  // Auto-loads older messages when the top sentinel becomes visible -
  // either because the user scrolled up to it, or because the loaded
  // chunk is short enough that it doesn't fill the viewport in the first
  // place (nothing to scroll, so a scroll-event-based trigger alone would
  // never fire). Re-arms whenever `loadOlderMessages` changes identity
  // (i.e. whenever `previousChunkId`/`loadingOlder` change), which
  // naturally repeats this after each load until the viewport is filled
  // or there's no more history.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !previousChunkId || loadingOlder) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlderMessages();
      },
      { root, threshold: 0 },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [previousChunkId, loadingOlder, loadOlderMessages]);

  // Distance (px) from the bottom within which we treat the view as "at
  // the bottom", for the scroll-to-bottom button.
  const NEAR_BOTTOM_PX = 80;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stickToBottomRef.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
  };

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    setShowScrollToBottom(false);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const send = async (content: string) => {
    // Belt-and-suspenders guard: `ChatInput` already blocks submission
    // while `disabled`, but `send` is also called directly from the
    // sidebar's suggestion buttons, so this is the single source of
    // truth that stops a second request from firing while one is still
    // in flight, no matter which caller triggers it.
    if (isThinking || !sessionId || !chatId) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content,
      createdAt: timestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // The assistant bubble is only added to `messages` once the first
    // token arrives (see the "token" branch below) - until then the
    // existing "Thinking..." indicator covers the wait, instead of an
    // empty bubble appearing alongside it.
    const assistantId = makeId();
    let started = false;

    try {
      for await (const event of streamQuery(sessionId, chatId, content)) {
        if (event.type === "token") {
          if (!started) {
            started = true;
            setStreamingId(assistantId);
            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: event.content,
                createdAt: timestamp(),
              },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + event.content }
                  : m,
              ),
            );
          }
        } else if (event.type === "done") {
          // `event.chat_id` is a stable conversation id - it never
          // changes, even once the conversation spans multiple storage
          // chunks (see `CHUNK_SIZE` in `backend/app/db/db_query.py`), so
          // there's nothing to follow here.
          setChatTitle(event.chat_title);
          if (event.sources.length > 0) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources: event.sources } : m,
              ),
            );
          }
          // Keep the sidebar's history list in sync - this call may have
          // just created the chat, titled it for the first time, or
          // bumped it to the top via a newer `created_at`.
          listChats(sessionId)
            .then(setChatHistory)
            .catch(() => {});
        } else if (event.type === "error") {
          throw new ApiError(event.message, 0);
        }
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to reach the backend. Is it running?";
      setMessages((prev) =>
        started
          ? prev.map((m) =>
              m.id === assistantId ? { ...m, content: `⚠️ ${message}` } : m,
            )
          : [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: `⚠️ ${message}`,
                createdAt: timestamp(),
              },
            ],
      );
    } finally {
      setIsThinking(false);
      setStreamingId(null);
    }
  };

  const newChat = () => {
    setMessages([]);
    setChatId(uuidv4());
    setChatTitle(null);
    setPreviousChunkId(null);
    stickToBottomRef.current = true;
    setShowScrollToBottom(false);
  };

  const openChat = async (id: string) => {
    if (isThinking || id === chatId) return;
    try {
      const detail = await getChatDetail(id);
      setChatId(detail.chat_id);
      setChatTitle(detail.chat_title);
      setMessages(toChatMessages(detail.messages));
      setPreviousChunkId(detail.previous_chunk_id);
      stickToBottomRef.current = true;
      setShowScrollToBottom(false);
    } catch {
      // Keep the current chat open if the fetch fails.
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        chatHistory={chatHistory}
        activeChatId={chatId}
        onSelectChat={openChat}
        onNewChat={newChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopOpen={desktopSidebarOpen}
        onCloseDesktop={() => setDesktopSidebarOpen(false)}
        online={online}
        disabled={isThinking || !historyLoaded}
      />

      <div className="chat-background flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={newChat}
          online={online}
        />

        <div className="hidden items-center justify-between px-6 py-4 md:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen((o) => !o)}
              aria-label={
                desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"
              }
              aria-pressed={desktopSidebarOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <SidebarIcon className="h-6 w-6" />
            </button>
            <h1 className="truncate text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {chatTitle ?? "New chat"}
            </h1>
          </div>

          <ThemeSwitch />
        </div>

        <div className="relative min-h-0 flex-1">
         
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="styled-scrollbar h-full overflow-y-auto"
          >
            {messages.length === 0 ? (
              <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center sm:px-6">
                <AssistantAvatar className="h-36 w-36" size={150} />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  Hi, I'm Rahul Suthar
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Ask me about my projects, experience, skills, education, or
                  the technologies I work with. I&#39;m here to help you explore
                  my portfolio through conversation.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 sm:px-6">
                <div ref={topSentinelRef} />
                {loadingOlder && (
                  <div className="flex items-center justify-center gap-2 py-1 text-xs text-neutral-400 dark:text-neutral-500">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading older messages...
                  </div>
                )}
                {messages.map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={message.id === streamingId}
                  />
                ))}
                {/* Once the assistant's message starts streaming it's
                  appended to `messages` (see `send`'s "token" branch),
                  so the last message stops being the user's - that's
                  the signal to swap this indicator for the growing bubble. */}
                {isThinking &&
                  messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-center gap-2.5">
                      <AssistantAvatar className="h-10 w-10" size={40} />
                      <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-400">
                        Thinking...
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to latest message"
            tabIndex={showScrollToBottom ? 0 : -1}
            className={`absolute bottom-4 right-1/2 flex h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md transition-all duration-200 hover:bg-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-white/10 ${
              showScrollToBottom
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
          {messages.length === 0 && (
            <div className="mb-2 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  disabled={isThinking || !historyLoaded}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <ChatInput onSend={send} disabled={isThinking || !historyLoaded} />
          <p className="mt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
            This AI is trained on Rahul's portfolio and experience. Responses may not always be perfect—please verify important information.
          </p>
        </div>
      </div>

      <HelpButton />
    </div>
  );
}

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M9 4v16" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
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
        d="M12 5v14M5 12l7 7 7-7"
      />
    </svg>
  );
}