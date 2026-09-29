import type { ComponentPropsWithRef, ReactNode } from "react";

type CardVariant = "primary" | "secondary" | "ghost" | "row";

type CardProps = ComponentPropsWithRef<"div"> & {
  children: ReactNode;
  variant?: CardVariant;
};

const variantClassNames: Record<CardVariant, string> = {
  primary: "orvia-card-primary", secondary: "orvia-card-secondary",
  ghost: "orvia-card-ghost", row: "orvia-card-row",
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
        "orvia-card",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
