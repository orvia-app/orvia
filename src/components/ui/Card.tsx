import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-none sm:p-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
