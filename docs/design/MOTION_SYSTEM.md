# Orvia Motion System

**Status:** DECIDED philosophy; exact emphasized recipes OPEN

Motion communicates change, hierarchy, spatial relationship, or feedback. It must never exist merely to make the product feel animated or intelligent.

## 1. Tiers and easing

| Tier | Use | Duration guidance | Easing intent |
| --- | --- | --- | --- |
| Instant | Direct selection, visibility needed immediately, reduced motion substitute | 0–80 ms | None or short linear fade |
| Fast | Hover, press, focus, compact disclosure | 120–160 ms | Decelerate on appearance; accelerate on removal |
| Normal | Dialog/sheet/popover entrance, local insertion/removal | 160–220 ms | Smooth, restrained ease-out/ease-in |
| Emphasized | Rare causal transition whose path helps understanding | Up to 250 ms | Custom curve requires rendered evidence |

Current CSS uses roughly 140 ms control transitions and 160–200 ms entrances/exits. These are CURRENT facts consistent with the target range, not proof of visual acceptance.

## 2. Pattern rules

| Pattern | Required behavior |
| --- | --- |
| Hover | Color/surface change only; no delayed response or large movement |
| Press | Immediate tactile acknowledgement; current 1 px translation or subtle scale is acceptable if stable |
| Focus | Focus indicator appears immediately; never animate in from invisible |
| Entrance | Small fade/translation only when it explains appearance; content remains usable without it |
| Exit | Shorter than entrance; surface becomes noninteractive while leaving |
| Navigation | Preserve orientation; avoid full-page decorative transitions for frequent moves |
| Dialog/sheet | Relate motion to origin/direction; backdrop and panel timing remain coherent |
| Popover/dropdown | Fast local reveal; focus is moved/restored predictably |
| List insertion/removal | Keep surrounding position understandable; offer Undo where behavior is reversible |
| Loading | Prefer static skeleton or restrained pulse; never imply progress without evidence |
| Feedback | Concise state change near the action; no confetti or celebratory spectacle |
| View change | Day/Week/Month or tabs change promptly; direction may be shown only when it improves orientation |

## 3. When motion is prohibited

- Continuous decorative movement, parallax, bouncing, animated gradients, or ambient glow.
- Animation that delays a frequent action or blocks input until completion.
- Motion as the only indication of success, failure, selection, ordering, or hierarchy.
- Large spatial movement that does not match the user's action.
- Automatic carousel or time-based content replacement without control.
- Repeated animation of static cards or every item on routine navigation.

## 4. Reduced motion

Respect `prefers-reduced-motion`. Remove transforms, parallax, scaling, looping animation, and smooth scrolling. Preserve necessary causality with an instant change or short opacity/color transition when safe. Focus, status text, and final state remain fully available.

The current global CSS disables animations, transitions, and smooth scrolling under reduced motion. Runtime behavior still requires manual verification.

## 5. Acceptance

Review motion at normal and reduced settings. Verify interruption, repeated use, keyboard timing, focus restoration, scroll position, and that no meaning disappears. Automated CSS inspection alone does not establish motion quality.
