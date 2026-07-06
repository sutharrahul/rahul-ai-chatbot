"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import AssistantAvatar from "./AssistantAvatar";
import { THEME_OPTIONS } from "./FloatingToolbar";
import StatusBadge from "./StatusBadge";

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  onNewChat: () => void;
  online: boolean | null;
}

export default function MobileHeader({ onOpenSidebar, onNewChat, online }: MobileHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white/80 px-2 py-2.5 backdrop-blur md:hidden dark:border-white/10 dark:bg-neutral-950/80">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <AssistantAvatar className="h-6 w-6" size={24} />
        <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
          Rahul Suthar
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
        >
          <PlusIcon className="h-4.5 w-4.5" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="More options"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
          >
            <DotsIcon className="h-4.5 w-4.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-neutral-900">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Theme
              </p>
              <div className="flex gap-1">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = mounted && theme === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      aria-label={`${label} theme`}
                      onClick={() => {
                        setTheme(value);
                        setMenuOpen(false);
                      }}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[10px] transition ${
                        active
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 border-t border-neutral-200 pt-3 dark:border-white/10">
                <p className="mb-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Backend status
                </p>
                <StatusBadge online={online} />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
