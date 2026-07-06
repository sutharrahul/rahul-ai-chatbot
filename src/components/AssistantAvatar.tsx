import Image from "next/image";

interface AssistantAvatarProps {
  className?: string;
  size?: number;
}

/**
 * The AI assistant's avatar image, used everywhere the assistant's
 * identity is shown (sidebar logo, message bubbles, empty state, etc.).
 * Centralized here so the artwork only needs to be swapped in one place.
 */
export default function AssistantAvatar({ className = "h-8 w-8", size = 32 }: AssistantAvatarProps) {
  return (
    <Image
      src="/assistant-avatar.avif"
      alt="AI assistant avatar"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      priority
    />
  );
}
