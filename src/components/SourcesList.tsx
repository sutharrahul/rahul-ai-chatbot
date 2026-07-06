import type { Source } from "@/lib/types";

export default function SourcesList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;

  return (
    <details className="mt-2 group">
      <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-800 select-none dark:text-neutral-400 dark:hover:text-neutral-200">
        {sources.length} source{sources.length > 1 ? "s" : ""}
      </summary>
      <ul className="mt-2 space-y-2">
        {sources.map((source, idx) => (
          <li
            key={`${source.document_id}-${source.chunk_index}-${idx}`}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-neutral-700 truncate dark:text-neutral-300">
                {source.filename}
              </span>
              <span className="shrink-0 text-neutral-400 dark:text-neutral-500">
                chunk #{source.chunk_index} · {(source.score * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-neutral-500 line-clamp-3">{source.content}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
