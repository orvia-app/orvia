import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClassNames: Record<BadgeVariant, string> = {
  default: "", success: "orvia-badge-success", warning: "orvia-badge-warning",
  danger: "orvia-badge-danger", info: "orvia-badge-info",
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
        "orvia-badge",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
