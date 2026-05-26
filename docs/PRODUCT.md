# Personal OS Product

## Vision

Personal OS is a future commercial, AI-native life and productivity operating system. It helps users capture, organize, retrieve, and act on personal, work, financial, vehicle, learning, and operational information from one trusted workspace.

The long-term product direction is a private second brain that remembers useful context, surfaces the right information, and executes safe user-approved actions.

## Target Users

- Knowledge workers managing fragmented personal and professional systems.
- Founders and operators who need a command center for tasks, notes, finances, vehicles, routines, and decisions.
- Users who want AI assistance without giving up privacy, ownership, or local-first control.
- Power users who prefer keyboard-first workflows, fast capture, and universal search.

## Positioning

- Personal AI Operating System.
- Your second brain that actually takes action.
- Local-first command center for life, work, memory, and automation.

## Product Direction

Personal OS should become an AI-native operating layer over a user's personal data and workflows. The product should not be a generic chatbot wrapped around notes. It should combine capture, structure, search, memory, timeline, planning, and action.

Near-term work should strengthen the deterministic product foundation before adding real AI:
- reliable capture
- trusted repositories
- reusable entities
- searchable data
- timeline/activity visibility
- daily briefing inputs
- explicit memory candidates
- keyboard-first commands

## Core Concepts

### Command Center

The command palette is the primary action surface. It currently supports route navigation plus task/note creation actions. Future commands should include entity opening, quick capture, AI actions, search results, and backend-backed workflows.

### Memory And Recall

Memory should be explicit, inspectable, source-linked, and deletable. Current memory work is a foundation only: memory candidates can be generated from entities and activity, and the Dashboard shows a read-only Memory Preview. There is no hidden AI memory or embedding service yet.

### Activity Timeline

The activity foundation models user-visible events across tasks, notes, inbox captures, finance transactions, and cars. Future timeline UI can use it for recency, audit history, daily/weekly recaps, and AI context.

### Daily Intelligence

Daily Briefing starts as deterministic aggregation of overdue tasks, today tasks, recent notes, and recent captures. Future AI summaries should be server-side enhancements over this structured input.

### Local-First And Privacy-First

The MVP stores data locally in the browser through repository helpers. This supports fast iteration and local-first behavior, but it is not secure cloud sync. Future sync must be opt-in, authenticated, exportable, deletable, and privacy-aware.

## Current Product Areas

- Dashboard with system overview, recent activity, and Memory Preview.
- Today with focus planning, Daily Briefing preview, AI suggestion placeholder, and quick capture.
- Inbox capture with deterministic parsing helpers.
- Tasks and Notes with local persistence.
- Search over normalized entities.
- Finance and Cars as early personal operations modules.
- AI Chat and Automation placeholders.
- Settings and theme support.
- Command palette for navigation and lightweight create actions.

## Current Non-Goals

- No production AI calls.
- No hidden or persistent AI memory.
- No backend, authentication, or multi-device sync.
- No payment or subscription handling.
- No external integrations.
- No secure vault behavior for browser storage.
- No team or enterprise features.

## Differentiators

- Local-first data model with a future cloud-sync path.
- Universal entity model spanning personal operations, not only notes/tasks.
- Command palette as an action surface, not only navigation.
- AI memory designed around explicit sources, user control, deletion, and privacy.
- Timeline and briefing foundations that can become AI context without opaque data handling.

## AI, Local, And Privacy Philosophy

AI should be additive, transparent, and bounded. The product should avoid hidden data transfer, frontend secrets, unnecessary external processing, and unverifiable claims. Future AI calls must run through server-side infrastructure with clear data boundaries, source references, export/delete support, and user approval for sensitive actions.
