import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-950 text-white shadow-sm shadow-zinc-950/10 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-none dark:hover:bg-white",
  secondary:
    "border border-zinc-200 bg-white text-zinc-800 shadow-sm shadow-zinc-950/[0.03] hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-none dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white",
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
        "inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-black",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
