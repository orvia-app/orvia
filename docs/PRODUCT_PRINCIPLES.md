# Archflow Product Principles

## Product Shape

Archflow should feel like a calm AI operating system for personal context: fast to capture into, easy to search, clear about what it knows, and careful about user control. It should feel closer to Linear, Raycast, Arc, and modern local-first productivity tools than to an admin panel or generic dashboard template.

## Core Loop

Archflow's core loop is:

1. Capture anything.
2. Organize it into useful structure.
3. Recall it through search, timeline, memory, and context.
4. Act through commands, tasks, notes, and future safe automation.

Every major feature should strengthen this loop.

## Principles

### Calm AI Operating System

The product should feel intelligent because it preserves context, relationships, recency, and user intent. Avoid loud AI branding, fake certainty, or chatbot-first design.

### Local-First And Privacy-First

Local-first behavior is a product value and an architecture constraint. Future cloud sync should be explicit, user-owned, exportable, deletable, and privacy-aware.

### Command-First UX

Command Center is the primary operating surface. New workflows should consider keyboard-first entry, quick capture, open entity, and action-command paths before adding more page chrome.

### No Fake AI

Do not imply real AI, semantic understanding, or cloud intelligence where the app is using deterministic local logic. Use honest labels such as deterministic, suggested, related, active, recent, or connected.

### User-Owned Data

Users should be able to understand, export, delete, and eventually sync their data. Memory, embeddings, integrations, logs, and derived AI outputs must remain linked to source data and deletion policy.

### Optional Modules

Archflow must not assume every user needs every module. Tasks, notes, finance, cars, automation, AI chat, Telegram capture, and future modules should become configurable per user.

### Future Integrations

Integrations should enter through secure backend boundaries. Telegram, email, calendar, messaging, and file integrations must respect consent, account linking, rate limits, export/delete, and secret handling.

### Memory And Context As Moat

The strategic advantage is source-linked context across capture, tasks, notes, timeline, search, and future AI memory. Relationship quality matters more than adding many disconnected features.

### Avoid Admin-Panel Feel

Archflow should not look or behave like a generic data management console. Prioritize hierarchy, scanability, calm surfaces, and flows that feel personal and operational.

### Avoid Feature Bloat

Do not add modules, settings, badges, or dashboards just because the architecture allows them. A feature should improve capture, organization, recall, action, trust, privacy, or extensibility.

## Decision Checklist

Before adding a feature, ask:
- Does this strengthen capture, organize, recall, or act?
- Is the current behavior honest about local-only and deterministic limits?
- Does the UI reduce cognitive load?
- Does it preserve local-first behavior and future backend migration?
- Does it avoid direct storage access in pages/components?
- Does it avoid frontend secrets and unapproved provider calls?
- Does it respect export/delete and future privacy requirements?
- Can it be disabled or hidden later if it is module-specific?

## Anti-Patterns

Avoid:
- Fake AI claims.
- Generic chatbot UX as the center of the product.
- Admin dashboard density and enterprise table sprawl.
- One-off components that duplicate shared UI primitives.
- Direct persistence or parsing in page components.
- Hidden data transfer to providers.
- Module creep without user control.
- Technical/debug labels in user-facing context UI.
