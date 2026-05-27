# Archflow QA Checklist

Use this checklist before merging meaningful changes or shipping a preview.

## Smoke Test

- App loads on Dashboard.
- No React errors in console.
- No hydration mismatch warnings.
- Primary navigation works.
- Theme controls work.
- Refresh preserves expected local data.

## Desktop Checklist

- Sidebar remains visible.
- Active sidebar item is visible.
- Theme controls stay accessible at the bottom.
- Dashboard layout has no clipped content.
- Search, Timeline, Tasks, Notes, Inbox, Today, Settings all render.
- Modals fit within viewport.

## Mobile Checklist

- Mobile header appears.
- Hamburger opens navigation drawer.
- Drawer includes all main routes.
- Drawer closes on route click.
- Drawer closes on Escape.
- Drawer closes on backdrop click.
- Theme controls are reachable.
- No horizontal scrolling at 390-430px widths.
- Floating capture button does not overlap important controls.
- Command Center fits mobile width.
- Task/note modals are usable on mobile.

## Dark/Light Checklist

- Dark theme applies on reload.
- Light theme applies on reload.
- System theme follows OS preference after hydration.
- Text contrast is readable.
- Icon-only buttons remain visible.
- Badges and selected states are clear.

## Persistence Checklist

- Create a task, refresh, confirm it remains.
- Create a note, refresh, confirm it remains.
- Create an inbox capture, refresh, confirm it remains where expected.
- Add finance/car data if the change touches those modules.
- Export downloads JSON.
- Reset local data clears Archflow keys and does not restore demo data after reset.
- Onboarding dismiss/reset state works.

## Command Center Checklist

- Cmd+K opens on macOS.
- Ctrl+K opens on Windows/Linux.
- Escape closes.
- ArrowUp/ArrowDown move selection.
- Enter executes selected command.
- Mouse hover and click feel responsive.
- Recent commands update.
- Create Task persists.
- Create Note persists.
- Navigation commands route correctly.

## Timeline, Search, Inbox, Tasks, Notes

- Timeline shows relevant task, note, capture, finance, and car activity when data exists.
- Timeline task cards route with useful filter/query context.
- Search returns grouped results.
- Search results navigate where URLs exist.
- Inbox preview detects type/workspace/tags deterministically.
- Inbox create flows preserve current behavior.
- Tasks filter from URL does not flicker.
- Task highlighting from URL still works.
- Notes create and display related context where applicable.

## Pre-Merge Checklist

```bash
npm run typecheck
npm run build
git diff --check
```

Also check:
- no extensionless TypeScript files
- no new direct storage access in pages/components
- no frontend secrets
- no unreviewed dependency additions
- docs updated when needed

## Vercel Preview Checklist

- Preview deploy builds successfully.
- Core routes load:
  - `/`
  - `/today`
  - `/inbox`
  - `/tasks`
  - `/notes`
  - `/search`
  - `/timeline`
  - `/settings`
- Mobile drawer works in preview.
- Theme reload behavior works.
- No server/client hydration warnings in browser console.
