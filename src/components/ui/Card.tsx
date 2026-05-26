import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "primary" | "secondary" | "ghost";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
};

const variantClassNames: Record<CardVariant, string> = {
  primary:
    "border border-zinc-200/70 bg-white shadow-sm shadow-zinc-950/[0.025] dark:border-zinc-800/70 dark:bg-zinc-950 dark:shadow-none",
  secondary:
    "border border-transparent bg-zinc-100/70 shadow-none dark:bg-zinc-900/45",
  ghost: "border border-transparent bg-transparent shadow-none",
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
        "rounded-2xl p-4 sm:p-5",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
