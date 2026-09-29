import type { ComponentPropsWithRef } from "react";

// Native props (including refs, autocomplete and validation) stay with callers.
export function Input({ className = "", ...props }: ComponentPropsWithRef<"input">) {
  return <input className={`orvia-field ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentPropsWithRef<"textarea">) {
  return <textarea className={`orvia-field orvia-textarea ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentPropsWithRef<"select">) {
  return <select className={`orvia-field ${className}`} {...props} />;
}
