"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import StatusBadge from "./StatusBadge";

export const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "system", label: "System", icon: SystemIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

interface FloatingToolbarProps {
  onNewChat: () => void;
  online: boolean | null;
}

export default function FloatingToolbar({ onNewChat, online }: FloatingToolbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!themeMenuOpen && !settingsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setThemeMenuOpen(false);
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [themeMenuOpen, settingsOpen]);

  const ThemeIcon = !mounted
    ? SystemIcon
    : theme === "light"
      ? SunIcon
      : theme === "dark"
        ? MoonIcon
        : SystemIcon;

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-1/2 z-40 hidden w-14 -translate-y-1/2 flex-col items-center gap-1 rounded-[28px] border border-neutral-200 bg-white/90 p-1.5 shadow-sm backdrop-blur transition-all duration-300 ease-in-out md:flex dark:border-white/10 dark:bg-white/5"
    >
      <ToolbarButton label="New chat" onClick={onNewChat}>
        <WandIcon className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        label={mounted ? `Theme: ${theme}` : "Theme"}
        onClick={() => {
          setThemeMenuOpen((open) => !open);
          setSettingsOpen(false);
        }}
      >
        <ThemeIcon className="h-4 w-4" />
      </ToolbarButton>

      <div
        className={`grid w-full transition-[grid-template-rows] duration-300 ease-in-out ${
          themeMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="my-1 flex flex-col items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
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
                    setThemeMenuOpen(false);
                  }}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "text-neutral-500 hover:bg-white hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        <ToolbarButton
          label="Status"
          onClick={() => {
            setSettingsOpen((open) => !open);
            setThemeMenuOpen(false);
          }}
        >
          <GearIcon className="h-4 w-4" />
        </ToolbarButton>

        {settingsOpen && (
          <div className="absolute right-full top-1/2 mr-2 w-44 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-neutral-900">
            <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Backend status
            </p>
            <StatusBadge online={online} />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

function WandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2ZM4 20l10-10M4.5 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </svg>
  );
}

export function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
      />
    </svg>
  );
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      />
    </svg>
  );
}

export function SystemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}
