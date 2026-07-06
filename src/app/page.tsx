"use client";

import { useEffect, useRef, useState } from "react";
import AssistantAvatar from "@/components/AssistantAvatar";
import ChatInput from "@/components/ChatInput";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import FloatingToolbar from "@/components/FloatingToolbar";
import HelpButton from "@/components/HelpButton";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import { checkHealth, queryRag, ApiError } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { profile } from "@/lib/assistant";

const SUGGESTIONS = [
  "Tell me about yourself",
  "What are Rahul's skills?",
  "Tell me about his experience",
  "What projects has he built?",
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function timestamp() {
  return Date.now();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkHealth().then(setOnline);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (content: string) => {
    // Belt-and-suspenders guard: `ChatInput` already blocks submission
    // while `disabled`, but `send` is also called directly from the
    // sidebar's suggestion buttons, so this is the single source of
    // truth that stops a second request from firing while one is still
    // in flight, no matter which caller triggers it.
    if (isThinking) return;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content,
      createdAt: timestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const { answer, sources } = await queryRag(content);
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: answer, sources, createdAt: timestamp() },
      ]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to reach the backend. Is it running?";
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: `⚠️ ${message}`, createdAt: timestamp() },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const newChat = () => setMessages([]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        suggestions={SUGGESTIONS}
        onSelect={send}
        onNewChat={newChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        disabled={isThinking}
      />

      <div className="chat-background flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={newChat}
          online={online}
        />

        <div className=" px-6 py-4 md:block">
          <h1 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Chat
          </h1>
        </div>

        {/*
          Scroll container: this element (not a wrapper) is the one with
          `overflow-y-auto`, and it intentionally carries NO padding/margin
          of its own. A custom-scrollbar element's track/thumb are laid out
          against its own box edges - any padding here (even just
          padding-bottom) visibly insets the thumb from the top/bottom,
          which is exactly the "floating, inset scrollbar" bug this fixes.
          `min-h-0` overrides flexbox's default `min-height: auto` on this
          flex-1 child so it actually shrinks to the space available
          between the header and the input bar instead of growing with its
          content - all spacing lives on the inner wrapper below instead.
        */}
        <div ref={scrollRef} className="styled-scrollbar min-h-0 flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center sm:px-6">
              <AssistantAvatar className="h-14 w-14" size={56} />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Ask me anything about {profile.name.split(" ")[0]}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                I&apos;m an AI assistant trained on {profile.name.split(" ")[0]}&apos;s
                background, skills, and projects. Try a suggestion from the menu
                to get started.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 sm:px-6">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {isThinking && (
                <div className="flex items-center gap-2.5">
                  <AssistantAvatar className="h-9 w-9" size={36} />
                  <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-neutral-400">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6 sm:pb-6">
          <ChatInput onSend={send} disabled={isThinking} />
        </div>
      </div>

      <FloatingToolbar onNewChat={newChat} online={online} />
      <HelpButton />
    </div>
  );
}
