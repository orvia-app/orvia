import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "orvia-button-primary",
  secondary: "orvia-button-secondary",
  ghost: "orvia-button-ghost",
  danger: "orvia-button-danger",
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
        "orvia-button",
        variantClassNames[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
