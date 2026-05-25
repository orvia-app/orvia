import type { LucideIcon } from "lucide-react";

export type CommandAction =
  | { type: "navigate"; href: string }
  | { type: "create-task"; initialTitle?: string }
  | {
      type: "create-note";
      initialTitle?: string;
      initialContent?: string;
    }
  | { type: "ai-action"; actionId: string; prompt?: string }
  | {
      type: "open-entity";
      entityType: string;
      entityId: string;
    };

export type CommandGroup =
  | "Navigate"
  | "Create"
  | "AI"
  | "Search"
  | "Entities";

export type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: readonly string[];
  group: CommandGroup;
  icon: LucideIcon;
  action: CommandAction;
};
