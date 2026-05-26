"use client";

import { CommandActionDialog } from "@/components/command-palette/CommandActionDialog";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { useCommandActions } from "@/components/command-palette/useCommandActions";
import { useCommandPalette } from "@/components/command-palette/useCommandPalette";
import { commandRegistry } from "@/lib/commands/registry";

export function CommandCenter() {
  const commandActions = useCommandActions();
  const commandPalette = useCommandPalette(commandRegistry, {
    enabled: !commandActions.activeAction,
    onAction: commandActions.openAction,
  });

  return (
    <>
      <CommandPalette
        activeIndex={commandPalette.activeIndex}
        commandSections={commandPalette.commandSections}
        commands={commandPalette.commands}
        inputRef={commandPalette.inputRef}
        onActiveIndexChange={commandPalette.onActiveIndexChange}
        onCommandSelect={commandPalette.onCommandSelect}
        onOpenChange={commandPalette.onOpenChange}
        onQueryChange={commandPalette.onQueryChange}
        open={commandPalette.open}
        query={commandPalette.query}
      />
      <CommandActionDialog
        action={commandActions.activeAction}
        firstFieldRef={commandActions.firstFieldRef}
        noteContent={commandActions.noteContent}
        noteTitle={commandActions.noteTitle}
        onClose={commandActions.closeAction}
        onNoteContentChange={commandActions.setNoteContent}
        onNoteTitleChange={commandActions.setNoteTitle}
        onSubmit={commandActions.submitAction}
        onTaskTitleChange={commandActions.setTaskTitle}
        taskTitle={commandActions.taskTitle}
      />
    </>
  );
}
