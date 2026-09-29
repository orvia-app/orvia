# Orvia product design system

Direction: a calm working environment, not a dashboard template. Violet identifies action and selection; neutral surfaces hold content. Existing capabilities, storage boundaries and authorization remain intact.

Status: implemented in the local working tree on 2026-09-29. See `testing/redesign-review.md` for actual rendered coverage and remaining limits.

## Design references

References recorded by the original proposal (not a new verification of these external pages):
- [Tailwind theme variables](https://tailwindcss.com/docs/theme): semantic tokens shared by light and dark modes, rather than page-specific palettes.
- [shadcn sidebar](https://ui.shadcn.com/docs/components/base/sidebar): separate navigation header, grouped content and account footer; responsive navigation is a distinct surface.
- [shadcn field](https://ui.shadcn.com/docs/components/base/field): consistent label/control/help/error hierarchy.
- [shadcn empty](https://ui.shadcn.com/docs/components/base/empty): one clear message and relevant action, without nested panels.
- [Radix dialog](https://www.radix-ui.com/primitives/docs/components/dialog): labelled modal, trapped focus, Escape and focus restoration. Existing behavior is retained; no dependency is added.
- [Tailwind transitions](https://tailwindcss.com/docs/transition-property): targeted state transitions and reduced-motion support.
- [Linear's interface redesign](https://linear.app/now/how-we-redesigned-the-linear-ui): lower visual noise and stronger hierarchy inform density decisions, not a copied visual identity.

## Tokens and rules

Colors live in globals.css: canvas, surface, subtle, hover, sidebar, line, foreground, muted, accent, accent-soft, on-accent, success, warning and danger. Light mode uses soft off-white canvas and white surfaces. Dark mode uses layered charcoal, not pure-black panels and translucent gradients. Text and semantic status colors have separate theme values.

Typography: existing Geist/system stack; shared page titles are approximately 24–26px, section titles 16–20px, body text 14–16px, and labels/metadata 12px. Marketing titles may be larger. Long Ukrainian copy wraps normally; user content is never cut to fit a fixed-height card.

Spacing: 4px base rhythm; 8/12px control gaps, 16/20px sections, 24/32px page gutters. Main content caps at 1120px; shared narrow pages at 800px (Settings keeps its existing 768px cap); reading pages at 720px; auth form at 384px; dialogs generally at 440–672px.

Radii: 6px small, 8px controls, 12px surfaces/dialogs. Pills are reserved for compact status markers. Shadows are reserved for overlays and focused floating surfaces.

Headers are unboxed. Lists use separators and hover backgrounds; content does not need a card inside a card. Primary action is violet; secondary actions use neutral borders; destructive actions use the danger token. Shared controls define visible focus and disabled states; this does not claim exhaustive accessibility conformance.

Forms share Input, Textarea and Select wrappers around native controls. Existing labels, input types, validation, autocomplete and submission logic remain in the calling screen. Native checkbox/radio behavior is retained.

Motion: 140ms controls and 180ms dialog/page entry. No staggered card animation, bouncing or delayed navigation. Reduced motion disables entry transforms, transitions and skeleton pulsing.

## Safety of visual review

Authenticated visual review uses a disposable copy outside the repository with synthetic account/data fixtures and no production configuration. Preview-only auth/data substitutions never enter the application's source or build. Visual evidence from that environment is not evidence of production authentication, synchronization or email delivery.
