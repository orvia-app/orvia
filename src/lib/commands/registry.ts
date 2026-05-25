import { actionCommands } from "@/lib/commands/actions";
import { routeCommands } from "@/lib/commands/routes";
import type { CommandItem } from "@/lib/commands/types";

export const commandRegistry: readonly CommandItem[] = [
  ...actionCommands,
  ...routeCommands,
];
