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
        "rounded-2xl border border-dashed border-zinc-300 text-center dark:border-zinc-800",
        sizeClassNames[size],
      ].join(" ")}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h3 className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {title}
      </h3>

      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
