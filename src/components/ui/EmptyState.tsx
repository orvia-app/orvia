import { CircleDashed } from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateSize = "default" | "sm";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon?: LucideIcon;
  size?: EmptyStateSize;
  title: string;
};

const sizeClassNames: Record<EmptyStateSize, string> = {
  default: "px-6 py-8",
  sm: "px-4 py-5",
};

export function EmptyState({
  action,
  description,
  icon: Icon = CircleDashed,
  size = "default",
  title,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-2xl bg-white/75 text-center shadow-sm shadow-zinc-950/[0.025] ring-1 ring-inset ring-zinc-200/75 dark:bg-zinc-900/45 dark:shadow-none dark:ring-zinc-800/75",
        sizeClassNames[size],
      ].join(" ")}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600 shadow-sm shadow-violet-950/[0.03] ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:shadow-none dark:ring-violet-500/20">
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

      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
