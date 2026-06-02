import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={[
        "animate-pulse rounded-lg bg-zinc-200/75 dark:bg-zinc-800/70",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
