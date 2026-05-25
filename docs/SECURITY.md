# Personal OS Security

## Current Security Posture

Personal OS is currently a local-first MVP. Data is stored in browser storage through typed repository helpers. There is no backend, authentication, cloud sync, production AI API integration, or payment system yet.

This document defines security direction, not completed production guarantees.

## Local-First Principles

- Keep MVP data local unless the user explicitly enables future sync.
- Validate parsed browser storage before use.
- Keep storage schemas understandable and migration-friendly.
- Avoid unnecessary third-party services.
- Avoid hidden analytics or unapproved external data transfer.

## No Frontend Secrets

Frontend code must never contain:
- OpenAI keys
- backend service-role keys
- payment provider secrets
- integration tokens
- database credentials
- private webhooks

Public configuration must be clearly safe for browser exposure.

## Server-Only API Keys

Future AI, integration, billing, and database credentials must live server-side only. Client components should call controlled backend endpoints or server actions, not third-party privileged APIs directly.

Future server endpoints should enforce:
- authentication
- authorization
- rate limits where appropriate
- input validation
- auditability for sensitive actions
- data minimization

## Future Auth and Session Architecture

Future auth should support:
- per-user data ownership
- secure session handling
- server-side authorization checks
- scoped access for integrations
- safe account deletion/export
- separation between user data and operational metadata

Client-side route visibility is not a security boundary. Backend authorization must enforce access.

## Browser Storage Risks

Current browser storage is suitable for MVP local-first behavior, but it is not a secure vault.

Risks:
- accessible to JavaScript running on the origin
- device/browser dependent
- can be cleared by the user or browser
- no built-in multi-device sync
- not appropriate for secrets or sensitive tokens

Do not store integration tokens, API keys, or high-risk secrets in localStorage.

## Future Encryption Direction

Encryption should be considered for synced user data, sensitive notes, AI memory, and integration credentials.

Potential future layers:
- TLS in transit
- database encryption at rest
- encrypted secrets management
- per-user encryption keys for sensitive payloads
- optional local encryption for high-sensitivity data

Encryption design should be chosen after backend/auth/sync architecture is defined.

## GDPR and Privacy Awareness

The product may target US/EU users, so architecture should support:
- user data export
- user data deletion
- clear data categories
- retention controls
- consent-aware integrations
- ability to delete AI-derived memory linked to source entities
- minimal collection by default

AI memory must remain inspectable and deletable.

## Future Backend Security Principles

When a backend is introduced:
- validate all inputs server-side
- enforce row-level or equivalent per-user ownership
- keep audit logs for sensitive operations
- isolate privileged jobs from client permissions
- avoid broad service-role usage in request paths
- rotate credentials safely
- monitor abuse and failed auth events
- treat AI tool execution as a privileged action

## AI Security Principles

Future AI features must:
- run through server-side gateways
- avoid sending unnecessary personal data
- include source references where possible
- distinguish generated content from user-authored content
- require user confirmation for destructive or external actions
- support deletion of AI-derived memory and summaries
