"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { createNote } from "@/lib/notes";
import { createTask } from "@/lib/tasks";
import type { CommandAction } from "@/lib/commands/types";
import { getLegacyWorkspaceId } from "@/lib/workspaces/workspaces";
import type { Task } from "@/types";

type CreatableCommandAction = Extract<
  CommandAction,
  { type: "create-task" } | { type: "create-note" }
>;

export function useCommandActions() {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [activeAction, setActiveAction] =
    useState<CreatableCommandAction | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const closeAction = useCallback(() => {
    setActiveAction(null);
    setTaskTitle("");
    setNoteTitle("");
    setNoteContent("");
  }, []);

  const openAction = useCallback((action: CommandAction) => {
    if (action.type === "create-task") {
      setTaskTitle(action.initialTitle ?? "");
      setActiveAction(action);
      return;
    }

    if (action.type === "create-note") {
      setNoteTitle(action.initialTitle ?? "");
      setNoteContent(action.initialContent ?? "");
      setActiveAction(action);
    }
  }, []);

  const submitAction = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!activeAction) {
        return;
      }

      if (activeAction.type === "create-task") {
        const title = taskTitle.trim();

        if (!title) {
          return;
        }

        const task: Task = {
          id: Date.now().toString(),
          title,
          priority: "medium",
          status: "todo",
          workspaceId: getLegacyWorkspaceId("personal"),
          createdAt: new Date().toISOString(),
        };

        createTask(task);
        closeAction();
        return;
      }

      const title = noteTitle.trim();
      const content = noteContent.trim();

      if (!title || !content) {
        return;
      }

      createNote({
        id: Date.now().toString(),
        title,
        content,
        type: "note",
      });
      closeAction();
    },
    [activeAction, closeAction, noteContent, noteTitle, taskTitle],
  );

  useEffect(() => {
    if (!activeAction) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeAction]);

  useEffect(() => {
    if (!activeAction) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeAction();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeAction, closeAction]);

  return {
    activeAction,
    closeAction,
    firstFieldRef,
    noteContent,
    noteTitle,
    openAction,
    setNoteContent,
    setNoteTitle,
    setTaskTitle,
    submitAction,
    taskTitle,
  };
}
