interface StatusBadgeProps {
  online: boolean | null;
}

export default function StatusBadge({ online }: StatusBadgeProps) {
  const label =
    online === null ? "Checking..." : online ? "Backend online" : "Backend offline";
  const color =
    online === null
      ? "bg-neutral-400"
      : online
        ? "bg-green-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
