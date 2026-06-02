import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-violet-700 text-white shadow-sm shadow-violet-950/15 hover:bg-violet-600 dark:bg-violet-500 dark:text-white dark:shadow-none dark:hover:bg-violet-400",
  secondary:
    "bg-white text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 hover:bg-violet-50 hover:text-violet-800 hover:ring-violet-200/80 dark:bg-zinc-950/60 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/25",
  ghost:
    "text-zinc-700 hover:bg-violet-50 hover:text-violet-800 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-200",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-950/10 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
