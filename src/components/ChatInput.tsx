"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_QUESTION_LENGTH } from "@/lib/api";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

// Only show the character counter once the user is getting close to the
// limit, so it doesn't clutter the input for ordinary short messages.
const COUNTER_THRESHOLD = MAX_QUESTION_LENGTH * 0.8;

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks the previous `disabled` value so we only refocus on the
  // false->true->false transition (i.e. right after a response comes
  // back), not on every render or on the initial mount.
  const wasDisabledRef = useRef(disabled);

  useEffect(() => {
    if (wasDisabledRef.current && !disabled) {
      // The textarea is briefly disabled while waiting for a reply, which
      // makes the browser drop focus from it. Re-focus it here so the
      // user can keep typing the next message without clicking back in.
      textareaRef.current?.focus();
    }
    wasDisabledRef.current = disabled;
  }, [disabled]);

  const submit = () => {
    const trimmed = value.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = MAX_QUESTION_LENGTH - value.length;
  const showCounter = value.length > COUNTER_THRESHOLD;
  const atLimit = remaining <= 0;

  return (
    <div className="flex flex-col gap-1">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-neutral-900"
      >
        <button
          type="button"
          aria-label="Add attachment"
          disabled
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 disabled:cursor-not-allowed dark:text-neutral-500"
        >
          <PlusIcon className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Type a message..."
          disabled={disabled}
          className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-50 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />

        <button
          type="button"
          aria-label="Voice input"
          disabled
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 disabled:cursor-not-allowed dark:text-neutral-500"
        >
          <MicIcon className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      </form>

      {showCounter && (
        <p
          className={`px-3 text-right text-xs ${
            atLimit
              ? "font-medium text-red-500 dark:text-red-400"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {atLimit
            ? `Message limit reached (${MAX_QUESTION_LENGTH} characters max)`
            : `${value.length} / ${MAX_QUESTION_LENGTH}`}
        </p>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path strokeLinecap="round" d="M5 10a7 7 0 0 0 14 0M12 21v-4" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
