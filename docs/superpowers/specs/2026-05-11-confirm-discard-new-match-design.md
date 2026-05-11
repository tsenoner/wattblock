# Wattblock — Confirm-discard on Neues Spiel

**Date:** 2026-05-11
**Status:** Approved
**Builds on:** `docs/superpowers/specs/2026-05-11-v0.1.2-mobile-and-ux.md`

## Goal

Guard against accidentally discarding a mid-game match when the user taps **Neues Spiel** on the setup screen. Use a two-tap inline confirmation: the first tap arms the button (red, label changes); the second confirms; any other interaction disarms.

This reverses the v0.1.2 non-goal *"No 'are you sure?' confirmation on Neues Spiel mid-game"*. The earlier decision was deliberate (the v0.1.2 spec preserved silent discard); we now want a confirmation step because accidental mid-game discards have proven costly.

## Non-Goals

- No native `confirm()` dialog and no modal overlay primitive. The app remains overlay-free.
- No confirmation on the `Revanche` banner after a winner — the match is already over.
- No animated colour transition on the armed/disarmed state change.
- No keyboard shortcut to disarm (Esc). Touch-first app; revisit only if asked.
- No storage schema change. Armed state is ephemeral and never persisted.
- No new automated tests for the click dispatcher. Coverage is via the manual smoke-test checklist.

---

## 1. Trigger conditions

The two-tap gate engages **only** when both:

- `state.scores.length > 0`
- `winnerOf(state) === null`

In all other cases tapping `Neues Spiel` discards immediately, preserving current behaviour:

- `scores.length === 0` — `Neues Spiel` is not rendered at all (today's render logic in `renderSetup`).
- A winner exists — the match is over; `newMatch` runs without a second tap.
- The `play-again` banner action — untouched; deliberate gesture on a finished match.

## 2. State location — ephemeral, not in `AppState`

The "armed" flag is transient UI state and lives as a module-local variable in `main.ts`:

```ts
let armDiscard = false;
```

Rationale for keeping it out of `AppState`:

- A reloaded page must not greet the user with an armed red button.
- Storage schema stays focused on match state; no migration guard work.
- The flag has no meaning outside the setup screen.

`render()` gains an optional third argument carrying ephemeral view-state, defaulting to `{ armDiscard: false }`:

```ts
export interface ViewState { armDiscard: boolean }
export function render(
  state: AppState,
  root: HTMLElement,
  view: ViewState = { armDiscard: false },
): void
```

Only `renderSetup` consumes `view.armDiscard`. `renderScoring` ignores it. The explicit third argument keeps `render.ts` free of `main.ts` imports and avoids a hidden module-global on the render side.

## 3. Reducer — unchanged

`state.ts`, `storage.ts`, and the persisted schema are untouched. `newMatch()` already does what the second tap needs. The two-tap is purely a UI gate before calling it. No persistence bump, no `state.test.ts` / `storage.test.ts` updates.

## 4. Click-handler logic (`main.ts`)

```ts
function rerender(): void {
  render(state, root!, { armDiscard });
}

function setState(next: AppState): void {
  if (next === state) return;
  state = next;
  save(state);
  armDiscard = false;   // any state change implicitly disarms
  rerender();
}

root.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const trigger = e.target.closest<HTMLElement>("[data-action]");
  const action = trigger?.dataset.action;

  // (a) Two-tap gate on Neues Spiel
  if (action === "new-match") {
    const inProgress = state.scores.length > 0 && winnerOf(state) === null;
    if (inProgress && !armDiscard) {
      armDiscard = true;
      rerender();
      return;
    }
    setState(newMatch(state));
    return;
  }

  // (b) Popover-style disarm: any other click disarms
  if (armDiscard) {
    armDiscard = false;
    rerender();
    // fall through — the click should still drive whatever else it hit
  }

  if (!trigger) return;
  switch (action) {
    /* existing cases unchanged */
  }
});
```

`setState` is the single chokepoint that clears `armDiscard` on any genuine state change. Falling through after `rerender()` on disarm means the click still drives whatever else it hit (preset chip, theme toggle, `Spiel fortsetzen`). The double render in the disarm-plus-action case is acceptable; `innerHTML` reflows on this app are sub-millisecond.

The existing `setStateNoRender` path (used for input events on team-name and custom-target fields) is unaffected: the `input` event is on a separate listener, doesn't touch `armDiscard`, and inputs don't fire the `click` disarm logic because we never re-render on input. If the user types in a name field while the button is armed, the armed state persists until they tap something. That's acceptable — typing isn't a "decision" and shouldn't silently change the meaning of the next tap.

## 5. Render change (`renderSetup`)

The existing markup:

```ts
<button type="button" class="setup__newmatch" data-action="new-match">Neues Spiel</button>
```

becomes (only when `Neues Spiel` is rendered — i.e. `scores.length > 0`):

```ts
const armed =
  view.armDiscard &&
  state.scores.length > 0 &&
  winnerOf(state) === null;

const newMatchLabel = armed ? "Fortschritt verwerfen!" : "Neues Spiel";
const newMatchClass = armed ? "setup__newmatch setup__newmatch--armed" : "setup__newmatch";
const newMatchAria  = armed ? "Fortschritt verwerfen — Bestätigen" : "Neues Spiel";
```

emitted as:

```html
<button type="button" class="${newMatchClass}" data-action="new-match" aria-label="${newMatchAria}">
  ${newMatchLabel}
</button>
```

Belt-and-braces armed check inside the renderer guards against an ephemeral/match-state desync. `Spiel fortsetzen` is unchanged and stays above — the safe option remains one tap away.

`renderSetup`'s signature gains `view: ViewState` as a second parameter, defaulting to `{ armDiscard: false }`. `render()` forwards `view` to it.

## 6. CSS — one new selector

Reuse the existing `--neg` token (warm red, defined for both light and dark themes — see `app.css:8` and `app.css:21`):

```css
.setup__newmatch--armed {
  background: var(--neg);
  color: var(--bg);
  border-color: var(--neg);
  font-weight: 700;
}
```

Same padding, border-radius, height, and `touch-action`/`user-select` rules apply because the base `.setup__newmatch` class is still present — `--armed` is additive. No layout shift between states. The font-weight bump (600 → 700) emphasises "this tap is committed."

No new token, no `data-theme` selector updates.

## 7. State Model Summary

`AppState` is unchanged.

New ephemeral view-state, internal to the runtime:

```ts
interface ViewState { armDiscard: boolean }
```

Lives only in `main.ts` (module-local `armDiscard` boolean) and is passed into `render()`. Not persisted.

## 8. File Changes

| Path | Change |
| --- | --- |
| `src/main.ts` | Module-local `armDiscard`, `rerender()` helper, two-tap gate added to the click handler, `setState` clears the flag on every state change. |
| `src/render.ts` | `render()` and `renderSetup()` gain a `ViewState` parameter (defaulted). `renderSetup` applies the armed label, class, and `aria-label` when the in-progress + armed conditions hold. |
| `src/app.css` | One new selector `.setup__newmatch--armed`. |
| `README.md` | New smoke-test items (see Testing). |

No files added. No files removed. No state-shape or storage change.

## 9. Testing

### Unit tests (Vitest)

No new unit tests. The reducer is untouched and the click-dispatcher in `main.ts` has no existing test surface in this project. Spinning up a jsdom-based dispatcher test purely for this feature is more scaffolding than the change warrants.

### Manual smoke test (added to README checklist)

- [ ] Mid-game (scores > 0, no winner), tap the gear → setup. Tap **Neues Spiel** once: the button turns red and reads **Fortschritt verwerfen!**. Scoring state is unchanged.
- [ ] From the armed state, second tap on the red button: scores and undone history are cleared. Setup view stays open with **Starten** (because `newMatch()` keeps `view: "setup"`, and with cleared scores the conditional renders the single primary button).
- [ ] From the armed state, tap **Spiel fortsetzen**: button disarms, scoring resumes with all scores intact.
- [ ] From the armed state, tap a preset target chip (11 / 15 / 18) or change the custom target: button disarms, target updates, scores intact.
- [ ] From the armed state, tap the theme toggle: button disarms, theme cycles, scores intact.
- [ ] From the armed state, reload the page: button is **not** armed after reload (ephemeral state is not persisted).
- [ ] After winning, gear → setup → tap **Neues Spiel**: scores clear immediately on first tap. No two-tap gate (game is over, `winnerOf !== null`).
- [ ] Fresh launch with no game (`scores.length === 0`): **Neues Spiel** is not rendered. Only **Starten**. Unchanged from today.

## Open Questions

None. All decisions resolved in brainstorming (trigger scope, UI approach, disarm behaviour, copy).
