import type { ComponentPropsWithRef, ReactNode } from "react";

type CardVariant = "primary" | "secondary" | "ghost" | "row";

type CardProps = ComponentPropsWithRef<"div"> & {
  children: ReactNode;
  variant?: CardVariant;
};

const variantClassNames: Record<CardVariant, string> = {
  primary:
    "border border-zinc-200/75 bg-white/90 shadow-sm shadow-zinc-950/[0.035] dark:border-zinc-800/75 dark:bg-zinc-900/70 dark:shadow-none",
  secondary:
    "border border-zinc-200/60 bg-zinc-100/65 shadow-none dark:border-zinc-800/60 dark:bg-zinc-900/45",
  ghost: "border border-transparent bg-transparent shadow-none",
  row: "orvia-card-row",
};

export function Card({
  children,
  className = "",
  variant = "primary",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        variant === "row" ? "orvia-card" : "min-w-0 rounded-2xl p-4 sm:p-5",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
