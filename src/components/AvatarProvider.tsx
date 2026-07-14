"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Must match the actual contents of public/avatar/ exactly - the browser
// can't list the directory at runtime, and these filenames are
// case-sensitive on deploy (Linux) even though macOS dev doesn't enforce
// that.
const AVATAR_FILES = ["image1.png", "image2.png", "Image3.png", "image4.png"];

// Shown until the client picks a real one (see AvatarProvider below) - SSR
// and the first client render both use this, so there's never a hydration
// mismatch. Must be one of AVATAR_FILES (not a separate asset) - the app
// only ships the images in public/avatar/.
export const FALLBACK_AVATAR_SRC = `/avatar/${AVATAR_FILES[0]}`;

function pickAvatarSrc(): string {
  const file = AVATAR_FILES[Math.floor(Math.random() * AVATAR_FILES.length)];
  return `/avatar/${file}`;
}

const AvatarContext = createContext<string>(FALLBACK_AVATAR_SRC);

export function useAssistantAvatarSrc(): string {
  return useContext(AvatarContext);
}

/**
 * Picks one of `public/avatar/*` at random, once per page load, and makes
 * it available to every `AssistantAvatar` instance via context - not a
 * module-level variable, since Next.js can split a "shared" module into
 * more than one bundle instance, which would silently break the "same
 * avatar everywhere" guarantee (each instance would pick its own).
 * Context is guaranteed single-instance for the whole tree it wraps,
 * regardless of bundling.
 */
export function AvatarProvider({ children }: { children: ReactNode }) {
  const [avatarSrc, setAvatarSrc] = useState(FALLBACK_AVATAR_SRC);

  useEffect(() => {
    // Runs once, client-side only, after mount - picks a fresh avatar for
    // this page load. Switching chats/routes within the same load never
    // re-runs this (no dependency on anything that changes), so the
    // avatar stays fixed until an actual reload re-executes this from
    // scratch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarSrc(pickAvatarSrc());
  }, []);

  return (
    <AvatarContext.Provider value={avatarSrc}>{children}</AvatarContext.Provider>
  );
}
