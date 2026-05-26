import { CircleDashed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type EmptyStateSize = "default" | "sm";

type EmptyStateProps = {
  description?: string;
  icon?: LucideIcon;
  size?: EmptyStateSize;
  title: string;
};

const sizeClassNames: Record<EmptyStateSize, string> = {
  default: "p-10",
  sm: "px-4 py-5",
};

export function EmptyState({
  description,
  icon: Icon = CircleDashed,
  size = "default",
  title,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-2xl bg-zinc-100/60 text-center ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-900/35 dark:ring-zinc-800/70",
        sizeClassNames[size],
      ].join(" ")}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:shadow-none dark:ring-zinc-800/80">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h3 className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {title}
      </h3>

      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
    </div>
  );
}
