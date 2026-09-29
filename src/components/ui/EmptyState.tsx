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
        "text-center",
        sizeClassNames[size],
      ].join(" ")}
    >
      <div className="mx-auto flex h-9 w-9 items-center justify-center text-muted">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h3 className="mt-3 text-sm font-medium text-foreground">
        {title}
      </h3>

      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
