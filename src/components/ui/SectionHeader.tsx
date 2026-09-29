import type { ReactNode } from "react";

type SectionHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  subtitle?: ReactNode;
  title: string;
};

export function SectionHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-6 text-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
