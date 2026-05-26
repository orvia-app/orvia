import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Section({
  children,
  className = "",
  ...props
}: SectionProps) {
  return (
    <section
      className={["space-y-3 sm:space-y-4", className].join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}
