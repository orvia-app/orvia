import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

type PageWidth = "default" | "narrow";

type PageProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: PageWidth;
};

type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  title: string;
};

type PageTextProps = {
  children: ReactNode;
};

type PageSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

type PageSectionHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title: string;
};

const pageWidthClassNames: Record<PageWidth, string> = {
  default: "max-w-[1120px]",
  narrow: "max-w-[800px]",
};

export function Page({
  children,
  className = "",
  width = "default",
  ...props
}: PageProps) {
  return (
    <div
      className={["orvia-page px-5 py-6 sm:px-8 sm:py-10 lg:px-10", className].join(" ")}
      {...props}
    >
      <div className={["mx-auto", pageWidthClassNames[width]].join(" ")}>
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ children }: PageTextProps) {
  return (
    <h1 className="text-[1.45rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.6rem] sm:leading-tight">
      {children}
    </h1>
  );
}

export function PageDescription({ children }: PageTextProps) {
  return (
    <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
      {children}
    </p>
  );
}

export function PageActions({ children }: PageTextProps) {
  return <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">{children}</div>;
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  icon: Icon,
  title,
}: PageHeaderProps) {
  return (
    <div className="border-b border-line pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {Icon ? (
            <div className="hidden h-8 w-6 shrink-0 items-center text-muted sm:flex">
              <Icon className="h-4.5 w-4.5" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <Badge>{eyebrow}</Badge> : null}
            <div className={eyebrow ? "mt-2" : ""}>
              <PageTitle>{title}</PageTitle>
            </div>
            {description ? (
              <PageDescription>{description}</PageDescription>
            ) : null}
          </div>
        </div>
        {actions ? <PageActions>{actions}</PageActions> : null}
      </div>
    </div>
  );
}

export function PageSection({
  children,
  className = "",
  ...props
}: PageSectionProps) {
  return (
    <section
      className={["mt-7 space-y-3 sm:space-y-4", className].join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}

export function PageSectionHeader({
  actions,
  description,
  eyebrow,
  title,
}: PageSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <PageSectionDescription>{description}</PageSectionDescription>
        ) : null}
      </div>
      {actions ? <div className="min-w-0 max-w-full">{actions}</div> : null}
    </div>
  );
}

export function PageSectionDescription({ children }: PageTextProps) {
  return (
    <p className="mt-1 text-sm leading-6 text-muted">
      {children}
    </p>
  );
}
