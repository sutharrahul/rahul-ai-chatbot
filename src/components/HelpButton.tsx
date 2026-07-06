"use client";

import { useState } from "react";
import { profile } from "@/lib/assistant";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 hidden md:block">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-lg dark:border-white/10 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-white">
            About this assistant
          </p>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            I&apos;m an AI assistant grounded in {profile.name}&apos;s resume,
            skills, and projects. Ask me anything about his background.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Help"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        ?
      </button>
    </div>
  );
}
