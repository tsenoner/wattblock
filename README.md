# Wattblock

> Minimaler, offline-fähiger Punkteblock für Watten · *Minimal, offline-first scoring pad for the Watten card game.*

## Installieren / Install

**Phone (iOS Safari):** Open the deployed URL → tap **Share** → **Add to Home Screen**.
**Phone (Android Chrome):** Open the deployed URL → menu → **Install app**.
**Desktop (Chrome / Edge):** open the URL → install icon in the URL bar.

After install the app works fully offline.

## Spielen / How to play

1. Setup: Spielziel wählen (11, 15, 18 oder eigene Zahl), Teamnamen eingeben, **Starten**.
2. Während des Spiels: über die seitlichen Knöpfe Punkte (2/3/4/5), Strafpunkte (−2) oder Zurück (↶) für das jeweilige Team eingeben.
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

Run before each release. Phone (or Chrome DevTools narrow viewport, 390 px):

- [ ] Setup screen renders; Starten disabled until both team names are non-empty.
- [ ] Preset chips (11 / 15 / 18) and custom number field both update the target.
- [ ] Score buttons add points to the correct column.
- [ ] Sum updates after every tap.
- [ ] Undo (↶) removes the last entry from its own column only.
- [ ] Gestrichen line appears at `sum ≥ target − 2`; disappears if undo brings sum below.
- [ ] Reaching target dims the point buttons (both teams); undo buttons stay active.
- [ ] Winner banner is one line, compact, clickable → starts new match with same names + target.
- [ ] Refresh the browser → state is restored (auto-persist).
- [ ] Tap SPIELZIEL number → returns to setup with current values; **Neues Spiel** button visible when scores exist.
- [ ] Install on phone → opens standalone, works in airplane mode.

## License

MIT © tsenoner
