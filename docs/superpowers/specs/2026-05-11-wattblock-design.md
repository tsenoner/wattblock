# Wattblock — Design Spec

**Date:** 2026-05-11
**Owner:** tsenoner
**Repo:** `github.com/tsenoner/wattblock` (public, MIT)
**Deployment:** Vercel (static)

## Goal

A minimal, installable, offline-first Progressive Web App that replaces the pen-and-paper scoring block used while playing Watten in person. No accounts, no sync, no ads, no nav. One scoring screen, one setup screen, persistent local state.

## Non-Goals

- No multiplayer / sync across devices.
- No game-history archive of finished matches.
- No statistics / analytics.
- No rule enforcement: the user enters the points, the app records them. Watten has too many regional variants to encode bidding logic, and that's not what a scoring block does anyway.
- No internationalization. UI is German only.
- No backend, no database, no auth.

## Domain Rules (the only ones the app encodes)

From research on the South Tyrolean variant (<https://en.wikipedia.org/wiki/Watten_(card_game)>, <https://watten-suedtirol.com/watten-punkte-zaehlen>):

- A match is played by two teams (the app does not care whether each team is one player or two — it stores one free-text label per team).
- A match ends when one team's sum reaches the target ("Spielziel").
- Common targets: **11, 15, 18**. The app offers those three plus a custom positive integer.
- Per-round point values entered by the user: **2, 3, 4, 5**, with a **−2** penalty button and an **undo** button.
- **Gestrichen:** a team is "gestrichen" when its sum is `≥ target − 2` (i.e. needs ≤ 2 more to win). The app marks this state automatically. Once gestrichen, the team's column shows a vertical strike line. The app does not change behaviour beyond the visual — entering points still works the same way.

## User Flows

### First launch
1. Setup screen appears with default state: target = 15, Team 1 = "", Team 2 = "".
2. User picks a target chip (11 / 15 / 18) or types a custom integer.
3. User types each team's label (free text; both required to start).
4. Tap **Starten** → scoring screen.

### During a match
- Each column has a side rail of buttons: **+2 / +3 / +4 / +5 / −2 / ↶**.
- Tapping a point button appends an entry to that column. The column's sum updates. If the new sum reaches `target − 2`, the column becomes gestrichen and renders the vertical strike line.
- Tapping **↶** removes the last entry from *that column's* history (per-column undo stack; matches the existing reference app and a player's mental model of "I tapped on my side, take it back").
- If a column's sum reaches `target`, the match ends: the four point buttons (`+2 / +3 / +4 / +5 / −2`) on both rails become disabled and dimmed. The **↶ undo** button on both rails stays active — undo must still work after match end so an erroneously-entered point doesn't trap the user. A banner at the bottom names the winner. Tapping the banner starts a new match with the same names and target.

### Editing setup mid-match
- Tap the target number at the top → opens the setup screen pre-filled with current values, with a destructive **Neues Spiel** button. Editing target/names and saving updates the current match in place (scores are kept). **Neues Spiel** wipes scores and returns to setup with the previous names/target prefilled.

### State persistence
- The full app state (setup + scores + match-ended flag) is serialised to `localStorage` on every change. On load, the state is restored verbatim. No migration logic needed for v1 (single schema version).

## Layout

Single-column phone layout. The scoring screen is a 4-column CSS grid:

```
| rail-L | col-A | col-B | rail-R |
   30px    1fr    1fr     30px
```

Rail-L's six buttons act on column A. Rail-R's six buttons act on column B. This matches the existing reference app (`watten.online/wattblock`) where the user's thumbs naturally rest on the screen edges.

Top of screen: small "SPIELZIEL" label and the target number (tappable to open setup).

Each column: header (team name), vertical list of point entries, thick rule, sum.

When a column is gestrichen, a 3px vertical strike line is drawn through the centre of the scores area (between header and sum), passing through all entries.

When the match ends, a dark banner is anchored inside the body with the winning team's name and the hint "tippen für neues Spiel".

Light / dark theme via `prefers-color-scheme`. No theme toggle.

## Architecture

### File layout

```
/
├── index.html
├── src/
│   ├── main.ts          # entry, mounts the app, registers SW
│   ├── state.ts         # pure state reducer + types
│   ├── storage.ts       # localStorage load/save
│   ├── render.ts        # DOM rendering (setup + scoring screens)
│   └── app.css
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   └── apple-touch-icon.png
├── vite.config.ts
├── tsconfig.json
├── package.json
├── vercel.json          # optional: SPA rewrite if needed
├── .gitignore
├── LICENSE              # MIT
└── README.md            # bilingual (de/en) install + dev notes
```

### State model

```ts
type TeamId = "A" | "B";

interface ScoreEntry {
  team: TeamId;
  value: number; // 2 | 3 | 4 | 5 | -2
}

interface AppState {
  setup: {
    target: number;        // positive integer
    teamA: string;
    teamB: string;
  };
  scores: ScoreEntry[];    // append-only chronological list
  view: "setup" | "scoring";
}
```

Derived values (computed on every render, never stored):

- `sumA = sum of scores where team === "A"`
- `sumB = sum of scores where team === "B"`
- `gestrichenA = sumA >= setup.target - 2`
- `winner: TeamId | null = sumA >= target ? "A" : sumB >= target ? "B" : null`

Derived state is intentionally not memoised — the input list is tiny (< 30 entries per match).

### Actions (the only mutations)

- `addPoint(team, value)` — push entry. Guard: no-op when `winner !== null` (state layer mirrors the UI's disabled state so a stray dispatch can't corrupt state).
- `undo(team)` — find the last entry where `entry.team === team`, splice it out. No-op if none. Allowed even when `winner !== null` (an entry-removal can un-win a match).
- `updateSetup(target, teamA, teamB)` — write new setup; scores preserved.
- `newMatch()` — clear `scores`, keep `setup`, set view to "setup".
- `start()` — set view to "scoring" (called from setup screen).
- `openSetup()` — set view to "setup".

Each action: produce a new `AppState`, persist it, re-render. No framework, no virtual DOM. The renderer rebuilds the screen from state each call; the app is small enough that direct DOM replacement is performant.

### Rendering

`render(state, root)` accepts the current state and the root element; it computes which screen to render (`setup` or `scoring`) and replaces `root.innerHTML` with the result. Event listeners are attached via event delegation on `root` (`click` handler reads `data-action` / `data-team` / `data-value` attributes).

This avoids the need for keyed reconciliation; with one root re-render per tap and ≤ 30 entries, total work is microseconds.

### PWA pieces

- **Manifest** (`vite-plugin-pwa` generates this from config): `name: "Wattblock"`, `short_name: "Wattblock"`, `display: "standalone"`, `theme_color`, `background_color`, four icons (192, 512, maskable-512, apple-touch).
- **Service worker** (Workbox via `vite-plugin-pwa`):
  - `registerType: "autoUpdate"` so users always get the latest deploy.
  - Precaches `**/*` from the build output → fully offline after first load.
- **iOS specifics**: include `<meta name="apple-mobile-web-app-capable" content="yes">` and `<link rel="apple-touch-icon" ...>`. iOS Safari doesn't show an install banner, so the README documents the "Share → Add to Home Screen" step.

## Deployment

- **GitHub:** repo `tsenoner/wattblock`, public, MIT licensed. `main` branch.
- **Vercel:** connect repo via Vercel dashboard. Build settings auto-detected for Vite (`npm run build` → `dist/`). No environment variables. No `vercel.json` needed unless we want a custom domain or rewrites (not for v1).
- **CI:** GitHub Action that runs `pnpm install && pnpm run build && pnpm test` on pull requests. Keeps `main` green. No deploy step in CI — Vercel handles that on push.

## Testing

The pure functions in `state.ts` (`addPoint`, `undo`, `gestrichen?`, `winner?`) get a Vitest unit-test file. Targets:

- Adding points updates the correct team's sum.
- Undo pops only that team's most recent entry.
- Gestrichen flips on at `sum === target − 2`, off if undo brings sum below.
- Winner is set when sum reaches target; not before.
- Negative points (−2) work; sum can go below 0 (allowed; matches paper convention).
- After winner is set, `addPoint` is rejected (the renderer disables those buttons; the state layer also guards, so a stray dispatch can't corrupt state). `undo` after a winning state un-wins correctly: when the popped entry's removal brings the previously-winning team back below target, `winner` becomes `null` and the buttons re-enable.

No DOM tests, no e2e — the UI is thin enough that manual smoke-testing on a phone is the right tool. A short manual test checklist is included in the README.

## Out of scope (v1)

- Multi-match / Bummerl tracking.
- Editing past entries (only undo).
- Sharing match results.
- Custom themes.
- Sound effects, haptics.
- Tutorial / help screen — the README handles that.

## Open questions

None at this time. All design decisions made above are reversible in v2 if play-testing reveals issues.
