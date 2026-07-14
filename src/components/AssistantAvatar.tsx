import Image from "next/image";
import { useAssistantAvatarSrc } from "./AvatarProvider";

interface AssistantAvatarProps {
  className?: string;
  size?: number;
}

/**
 * The AI assistant's avatar image, used everywhere the assistant's
 * identity is shown (sidebar logo, message bubbles, empty state, etc.).
 * Centralized here so the artwork only needs to be swapped in one place.
 * The actual image (one of `public/avatar/*`, picked at random once per
 * page load) comes from `AvatarProvider` via context, shared by every
 * instance - see `AvatarProvider.tsx`.
 */
export default function AssistantAvatar({ className = "h-8 w-8", size = 32 }: AssistantAvatarProps) {
  const src = useAssistantAvatarSrc();

  return (
    <Image
      src={src}
      alt="AI assistant avatar"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      priority
    />
  );
}
