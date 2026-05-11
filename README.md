# Wattblock

> Minimaler, offline-fähiger Punkteblock für Watten · *Minimal, offline-first scoring pad for the Watten card game.*

## Installieren / Install

**Phone (iOS Safari):** Open the deployed URL → tap **Share** → **Add to Home Screen**.
**Phone (Android Chrome):** Open the deployed URL → menu → **Install app**.
**Desktop (Chrome / Edge):** open the URL → install icon in the URL bar.

After install the app works fully offline.

## Spielen / How to play

1. Setup: Spielziel wählen (11, 15, 18 oder eigene Zahl), Teamnamen eingeben, **Starten**.
2. Während des Spiels: über die seitlichen Knöpfe Punkte (2/3/4/5) und Strafpunkte (−2) eintragen; mit **Zurück / Wiederholen** unter den Spalten einen Zug rückgängig machen oder wiederherstellen.
3. Wenn die Summe eines Teams `Ziel − 2` erreicht, erscheint automatisch der vertikale Strich ("gestrichen").
4. Wenn ein Team das Ziel erreicht, wird der Sieger unten eingeblendet. Tippen → neues Spiel.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # vitest
pnpm build      # → dist/
pnpm preview    # serve dist/ locally
```

## Deploy

Push to GitHub. Connect the repo in Vercel → it auto-detects Vite. No env vars.

## Manuelle Tests / Manual smoke test

Run before each release. Phone (or Chrome DevTools narrow viewport, 390 px).

### Core (carried from v0.1.0 / v0.1.1)

- [ ] Setup screen renders; **Starten** is always enabled. Empty team names render as "Team 1" / "Team 2".
- [ ] Preset chips (11 / 15 / 18) and custom number field both update the target.
- [ ] Score buttons add points to the correct column. Sum updates after every tap.
- [ ] Gestrichen line appears at `sum ≥ target − 2`; disappears if undo brings sum below.
- [ ] Reaching target dims the point buttons (both teams); history buttons stay active.
- [ ] Refresh the browser → state is restored. A finished match is consumed on next launch (auto-fresh setup).
- [ ] Install on phone → opens standalone, works in airplane mode.

### v0.1.2 manual smoke test

- [ ] No vertical scrollbar on a notched phone with an empty board (iPhone target = 15, no scores).
- [ ] Double-tapping any point button (2 / 3 / 4 / 5 / −2) or Zurück / Wiederholen does **not** zoom the page.
- [ ] Theme toggle (top-right corner of both setup and scoring) flips between light and dark. Reload — theme persists.
- [ ] Add a `3` for team A. Tap **Zurück**. The `3` disappears, **Wiederholen** is enabled. Tap **Wiederholen**. The `3` reappears.
- [ ] Add a `2` for team B. **Wiederholen** is disabled (new action invalidated redo).
- [ ] From a mid-game state, tap the gear. Setup shows **Spiel fortsetzen** (primary) + **Neues Spiel** (secondary). Tap **Spiel fortsetzen** — scoring resumes with all scores intact.
- [ ] Win a match. Banner shows two lines: `<Team> gewinnt` and `Revanche ↻`. Tap it — scores clear, scoring view shows fresh columns.

## License

MIT © tsenoner
