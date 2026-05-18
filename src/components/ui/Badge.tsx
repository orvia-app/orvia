import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClassNames: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  danger:
    "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  info:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

export function Badge({
  children,
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}