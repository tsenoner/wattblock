# Wattblock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal, installable, offline-first PWA for keeping score in a Watten match — vanilla TypeScript, Vite, vite-plugin-pwa, deployed to Vercel.

**Architecture:** A pure state reducer in `state.ts` (typed, fully unit-tested) drives a hand-rolled DOM renderer in `render.ts`. `storage.ts` persists state to `localStorage` on every change. `main.ts` wires the action loop: `event → action → newState → persist → render`. `vite-plugin-pwa` generates the manifest + Workbox service worker that precaches everything for offline use.

**Tech Stack:** TypeScript, Vite, vite-plugin-pwa (Workbox), Vitest, pnpm, @vite-pwa/assets-generator (one-shot icon generation), Vercel (static deploy), GitHub Actions (CI).

**Commit style:** Angular Conventional Commits — `<type>(<scope>): <subject>` where `type ∈ { feat, fix, docs, style, refactor, perf, test, chore, build, ci }`. Subject is imperative mood, no trailing period.

**Spec:** `docs/superpowers/specs/2026-05-11-wattblock-design.md`

---

## File Map

| Path | Purpose |
| --- | --- |
| `package.json` | deps, scripts |
| `tsconfig.json` | TS compiler config (app) |
| `tsconfig.node.json` | TS compiler config (vite.config.ts) |
| `vite.config.ts` | Vite + vite-plugin-pwa config |
| `pwa-assets.config.ts` | icon generator config |
| `index.html` | shell HTML, mounts root, includes PWA meta |
| `src/main.ts` | entry: load state, attach event handlers, register SW |
| `src/state.ts` | `AppState` type + pure reducer (`addPoint`, `undo`, …) + selectors |
| `src/state.test.ts` | Vitest unit tests for `state.ts` |
| `src/storage.ts` | `load()` / `save()` against `localStorage` |
| `src/render.ts` | `render(state, root)` — setup + scoring screens |
| `src/app.css` | all styles (light/dark via `prefers-color-scheme`) |
| `public/logo.svg` | source icon (used to generate PNGs) |
| `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`, `favicon.ico` | generated from `logo.svg` |
| `README.md` | bilingual (de/en) install + dev notes |
| `LICENSE` | MIT |
| `.github/workflows/ci.yml` | test + build on PRs |

---

## Task 1: Scaffold project + verify dev server

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `LICENSE`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "wattblock",
  "version": "0.1.0",
  "description": "Offline-first Watten scoring block",
  "license": "MIT",
  "author": "tsenoner",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "generate-pwa-assets": "pwa-assets-generator"
  },
  "devDependencies": {
    "@vite-pwa/assets-generator": "^0.2.6",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "vite-plugin-pwa/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "pwa-assets.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts` (no PWA yet — added in Task 9)**

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "es2020" },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#2b2a26" />
    <title>Wattblock</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.ts` (placeholder)**

```ts
const root = document.querySelector<HTMLDivElement>("#app");
if (root) root.textContent = "Wattblock";
```

- [ ] **Step 7: Create `LICENSE` (MIT, year 2026, author tsenoner)**

Use the standard MIT text with `Copyright (c) 2026 tsenoner`. (Full text omitted here — copy verbatim from <https://opensource.org/license/mit>.)

- [ ] **Step 8: Install + verify dev server**

```bash
pnpm install
pnpm dev
```

Expected: server prints `Local: http://localhost:5173/`. Open in browser. Page shows the text "Wattblock". Stop with Ctrl-C.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/main.ts LICENSE pnpm-lock.yaml
git commit -m "build: scaffold Vite + TypeScript project"
```

---

## Task 2: State module — types and initial state (TDD)

**Files:**
- Create: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Add Vitest entry to `vite.config.ts`**

Replace `vite.config.ts` contents with:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "es2020" },
  test: { environment: "node" },
});
```

- [ ] **Step 2: Write failing test for `INITIAL_STATE`**

Create `src/state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./state";

describe("INITIAL_STATE", () => {
  it("starts in setup view, target 15, blank names, no scores", () => {
    expect(INITIAL_STATE).toEqual({
      setup: { target: 15, teamA: "", teamB: "" },
      scores: [],
      view: "setup",
    });
  });
});
```

- [ ] **Step 3: Run test, expect FAIL**

```bash
pnpm test
```

Expected: error "Failed to resolve import './state'".

- [ ] **Step 4: Create minimal `src/state.ts`**

```ts
export type TeamId = "A" | "B";

export interface ScoreEntry {
  team: TeamId;
  value: number;
}

export interface Setup {
  target: number;
  teamA: string;
  teamB: string;
}

export interface AppState {
  setup: Setup;
  scores: ScoreEntry[];
  view: "setup" | "scoring";
}

export const INITIAL_STATE: AppState = {
  setup: { target: 15, teamA: "", teamB: "" },
  scores: [],
  view: "setup",
};
```

- [ ] **Step 5: Run test, expect PASS**

```bash
pnpm test
```

Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/state.ts src/state.test.ts vite.config.ts
git commit -m "feat(state): add AppState types and INITIAL_STATE"
```

---

## Task 3: State — `addPoint` action

**Files:**
- Modify: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/state.test.ts`:

```ts
import { addPoint } from "./state";

describe("addPoint", () => {
  it("appends an entry for team A", () => {
    const next = addPoint(INITIAL_STATE, "A", 3);
    expect(next.scores).toEqual([{ team: "A", value: 3 }]);
  });

  it("appends an entry for team B without touching A's entries", () => {
    const after1 = addPoint(INITIAL_STATE, "A", 2);
    const after2 = addPoint(after1, "B", 4);
    expect(after2.scores).toEqual([
      { team: "A", value: 2 },
      { team: "B", value: 4 },
    ]);
  });

  it("returns a new state object (does not mutate input)", () => {
    const next = addPoint(INITIAL_STATE, "A", 2);
    expect(next).not.toBe(INITIAL_STATE);
    expect(INITIAL_STATE.scores).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

```bash
pnpm test
```

Expected: "addPoint is not exported".

- [ ] **Step 3: Implement `addPoint`**

Append to `src/state.ts`:

```ts
export function addPoint(state: AppState, team: TeamId, value: number): AppState {
  return { ...state, scores: [...state.scores, { team, value }] };
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm test
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat(state): add addPoint reducer"
```

---

## Task 4: State — selectors (`sumA`, `sumB`, `gestrichenA`, `gestrichenB`, `winner`)

**Files:**
- Modify: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/state.test.ts`:

```ts
import { sumFor, isGestrichen, winnerOf } from "./state";

describe("selectors", () => {
  const after = (entries: Array<[TeamId, number]>): AppState =>
    entries.reduce<AppState>((s, [t, v]) => addPoint(s, t, v), INITIAL_STATE);

  it("sumFor adds all entries for the given team", () => {
    const s = after([["A", 3], ["B", 2], ["A", 4]]);
    expect(sumFor(s, "A")).toBe(7);
    expect(sumFor(s, "B")).toBe(2);
  });

  it("sumFor handles negative entries", () => {
    const s = after([["A", 3], ["A", -2]]);
    expect(sumFor(s, "A")).toBe(1);
  });

  it("isGestrichen is true when sum >= target − 2", () => {
    const s = after([["A", 5], ["A", 5], ["A", 3]]); // sum 13, target 15
    expect(isGestrichen(s, "A")).toBe(true);
    expect(isGestrichen(s, "B")).toBe(false);
  });

  it("isGestrichen is false below target − 2", () => {
    const s = after([["A", 5], ["A", 5], ["A", 2]]); // sum 12, target 15
    expect(isGestrichen(s, "A")).toBe(false);
  });

  it("winnerOf returns the team that reached target", () => {
    const s = after([["A", 5], ["A", 5], ["A", 5]]); // sum 15
    expect(winnerOf(s)).toBe("A");
  });

  it("winnerOf returns null before anyone reaches target", () => {
    const s = after([["A", 5], ["B", 4]]);
    expect(winnerOf(s)).toBeNull();
  });

  it("winnerOf returns the team that overshoots target (e.g. via 5-pt win)", () => {
    const s: AppState = { ...INITIAL_STATE, setup: { ...INITIAL_STATE.setup, target: 11 } };
    const after5 = addPoint(addPoint(s, "B", 5), "B", 5); // sum 10
    const winB = addPoint(after5, "B", 5);                 // sum 15 > 11
    expect(winnerOf(winB)).toBe("B");
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

```bash
pnpm test
```

Expected: "sumFor is not exported".

- [ ] **Step 3: Implement selectors**

Append to `src/state.ts`:

```ts
export function sumFor(state: AppState, team: TeamId): number {
  return state.scores
    .filter((e) => e.team === team)
    .reduce((acc, e) => acc + e.value, 0);
}

export function isGestrichen(state: AppState, team: TeamId): boolean {
  return sumFor(state, team) >= state.setup.target - 2;
}

export function winnerOf(state: AppState): TeamId | null {
  if (sumFor(state, "A") >= state.setup.target) return "A";
  if (sumFor(state, "B") >= state.setup.target) return "B";
  return null;
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm test
```

Expected: `11 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat(state): add sumFor, isGestrichen, winnerOf selectors"
```

---

## Task 5: State — `addPoint` is rejected after winner is decided

**Files:**
- Modify: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Write failing test**

Append to `src/state.test.ts`:

```ts
describe("addPoint guards", () => {
  it("is a no-op when a winner already exists", () => {
    const won: AppState = {
      ...INITIAL_STATE,
      scores: [{ team: "A", value: 5 }, { team: "A", value: 5 }, { team: "A", value: 5 }],
    };
    expect(winnerOf(won)).toBe("A");
    const next = addPoint(won, "B", 2);
    expect(next).toBe(won); // same reference — proves no-op
  });
});
```

- [ ] **Step 2: Run test, expect FAIL**

```bash
pnpm test
```

Expected: `next` is a new object — the test fails on `toBe(won)`.

- [ ] **Step 3: Update `addPoint` to guard**

Replace the existing `addPoint` body in `src/state.ts`:

```ts
export function addPoint(state: AppState, team: TeamId, value: number): AppState {
  if (winnerOf(state) !== null) return state;
  return { ...state, scores: [...state.scores, { team, value }] };
}
```

- [ ] **Step 4: Run tests, expect PASS**

```bash
pnpm test
```

Expected: `12 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat(state): guard addPoint after winner is decided"
```

---

## Task 6: State — `undo` action

**Files:**
- Modify: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/state.test.ts`:

```ts
import { undo } from "./state";

describe("undo", () => {
  it("removes the last entry of the given team only", () => {
    const s: AppState = {
      ...INITIAL_STATE,
      scores: [
        { team: "A", value: 2 },
        { team: "B", value: 3 },
        { team: "A", value: 4 },
        { team: "B", value: 5 },
      ],
    };
    const next = undo(s, "A");
    expect(next.scores).toEqual([
      { team: "A", value: 2 },
      { team: "B", value: 3 },
      { team: "B", value: 5 },
    ]);
  });

  it("is a no-op when team has no entries", () => {
    const s: AppState = {
      ...INITIAL_STATE,
      scores: [{ team: "B", value: 3 }],
    };
    const next = undo(s, "A");
    expect(next).toBe(s);
  });

  it("works after a winner — un-wins the match", () => {
    const won: AppState = {
      ...INITIAL_STATE,
      scores: [{ team: "A", value: 5 }, { team: "A", value: 5 }, { team: "A", value: 5 }],
    };
    expect(winnerOf(won)).toBe("A");
    const after = undo(won, "A");
    expect(winnerOf(after)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

- [ ] **Step 3: Implement `undo`**

Append to `src/state.ts`:

```ts
export function undo(state: AppState, team: TeamId): AppState {
  const lastIdx = (() => {
    for (let i = state.scores.length - 1; i >= 0; i--) {
      if (state.scores[i].team === team) return i;
    }
    return -1;
  })();
  if (lastIdx === -1) return state;
  const scores = state.scores.slice(0, lastIdx).concat(state.scores.slice(lastIdx + 1));
  return { ...state, scores };
}
```

- [ ] **Step 4: Run tests, expect PASS**

Expected: `15 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat(state): add undo action"
```

---

## Task 7: State — setup/lifecycle actions (`updateSetup`, `newMatch`, `start`, `openSetup`)

**Files:**
- Modify: `src/state.ts`, `src/state.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/state.test.ts`:

```ts
import { updateSetup, newMatch, start, openSetup } from "./state";

describe("lifecycle actions", () => {
  it("updateSetup overwrites setup but keeps scores and view", () => {
    const s: AppState = {
      ...INITIAL_STATE,
      view: "scoring",
      scores: [{ team: "A", value: 2 }],
    };
    const next = updateSetup(s, { target: 18, teamA: "X", teamB: "Y" });
    expect(next.setup).toEqual({ target: 18, teamA: "X", teamB: "Y" });
    expect(next.scores).toEqual([{ team: "A", value: 2 }]);
    expect(next.view).toBe("scoring");
  });

  it("newMatch clears scores, keeps setup, switches to setup view", () => {
    const s: AppState = {
      ...INITIAL_STATE,
      view: "scoring",
      setup: { target: 11, teamA: "X", teamB: "Y" },
      scores: [{ team: "A", value: 5 }],
    };
    const next = newMatch(s);
    expect(next.scores).toEqual([]);
    expect(next.setup).toEqual({ target: 11, teamA: "X", teamB: "Y" });
    expect(next.view).toBe("setup");
  });

  it("start switches view to scoring", () => {
    expect(start(INITIAL_STATE).view).toBe("scoring");
  });

  it("openSetup switches view to setup", () => {
    const s: AppState = { ...INITIAL_STATE, view: "scoring" };
    expect(openSetup(s).view).toBe("setup");
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL**

- [ ] **Step 3: Implement lifecycle actions**

Append to `src/state.ts`:

```ts
export function updateSetup(state: AppState, setup: Setup): AppState {
  return { ...state, setup };
}

export function newMatch(state: AppState): AppState {
  return { ...state, scores: [], view: "setup" };
}

export function start(state: AppState): AppState {
  return { ...state, view: "scoring" };
}

export function openSetup(state: AppState): AppState {
  return { ...state, view: "setup" };
}
```

- [ ] **Step 4: Run tests, expect PASS**

Expected: `19 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/state.ts src/state.test.ts
git commit -m "feat(state): add updateSetup, newMatch, start, openSetup actions"
```

---

## Task 8: Storage module — `load` / `save` against `localStorage`

**Files:**
- Create: `src/storage.ts`, `src/storage.test.ts`

- [ ] **Step 1: Add `jsdom` for DOM-aware tests**

Append to `package.json` `devDependencies`:

```json
    "jsdom": "^25.0.0"
```

Run `pnpm install`.

- [ ] **Step 2: Update `vite.config.ts` to use `jsdom` for the storage test file**

Replace the `test` block:

```ts
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/storage.test.ts", "jsdom"]],
  },
```

- [ ] **Step 3: Write failing tests**

Create `src/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_STATE, type AppState } from "./state";
import { load, save, STORAGE_KEY } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("load returns INITIAL_STATE when nothing is stored", () => {
    expect(load()).toEqual(INITIAL_STATE);
  });

  it("save then load round-trips the state", () => {
    const s: AppState = {
      setup: { target: 11, teamA: "X", teamB: "Y" },
      scores: [{ team: "A", value: 3 }],
      view: "scoring",
    };
    save(s);
    expect(load()).toEqual(s);
  });

  it("load returns INITIAL_STATE when stored JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(load()).toEqual(INITIAL_STATE);
  });

  it("load returns INITIAL_STATE when stored shape is wrong", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(load()).toEqual(INITIAL_STATE);
  });
});
```

- [ ] **Step 4: Run tests, expect FAIL**

- [ ] **Step 5: Implement `src/storage.ts`**

```ts
import { INITIAL_STATE, type AppState } from "./state";

export const STORAGE_KEY = "wattblock:v1";

function isAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.setup !== "object" || v.setup === null) return false;
  const setup = v.setup as Record<string, unknown>;
  if (typeof setup.target !== "number") return false;
  if (typeof setup.teamA !== "string") return false;
  if (typeof setup.teamB !== "string") return false;
  if (!Array.isArray(v.scores)) return false;
  if (v.view !== "setup" && v.view !== "scoring") return false;
  return true;
}

export function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return INITIAL_STATE;
    const parsed: unknown = JSON.parse(raw);
    return isAppState(parsed) ? parsed : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

export function save(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

- [ ] **Step 6: Run tests, expect PASS**

Expected: `23 passed`.

- [ ] **Step 7: Commit**

```bash
git add src/storage.ts src/storage.test.ts vite.config.ts package.json pnpm-lock.yaml
git commit -m "feat(storage): add localStorage persistence with schema guard"
```

---

## Task 9: PWA setup — `vite-plugin-pwa` + manifest + generated icons

**Files:**
- Create: `public/logo.svg`, `pwa-assets.config.ts`
- Modify: `vite.config.ts`, `index.html`, `src/main.ts`
- Generated: `public/icon-*.png`, `public/apple-touch-icon-180.png`, `public/favicon.ico`

- [ ] **Step 1: Create `public/logo.svg`**

A simple wordmark on a dark background:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#2b2a26"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
    font-family="ui-sans-serif, system-ui, -apple-system, sans-serif"
    font-weight="700" font-size="220" fill="#faf7f0">W</text>
</svg>
```

- [ ] **Step 2: Create `pwa-assets.config.ts`**

```ts
import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset,
  images: ["public/logo.svg"],
});
```

- [ ] **Step 3: Generate icons**

```bash
pnpm generate-pwa-assets
```

Expected: writes `public/pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`. (Exact filenames come from the preset; the manifest config in step 4 references these exact names.)

- [ ] **Step 4: Update `vite.config.ts` to register vite-plugin-pwa**

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: { target: "es2020" },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Wattblock",
        short_name: "Wattblock",
        description: "Watten-Punkteblock — offline & installierbar.",
        lang: "de",
        theme_color: "#2b2a26",
        background_color: "#faf7f0",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    }),
  ],
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/storage.test.ts", "jsdom"]],
  },
});
```

- [ ] **Step 5: Add iOS PWA meta tags to `index.html`**

Replace `index.html` `<head>` with:

```html
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#2b2a26" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Wattblock" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <title>Wattblock</title>
  </head>
```

- [ ] **Step 6: Register the SW in `src/main.ts`**

Replace `src/main.ts`:

```ts
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (root) root.textContent = "Wattblock";
```

- [ ] **Step 7: Verify build succeeds with PWA artifacts**

```bash
pnpm build
ls dist/
```

Expected: `dist/` contains `index.html`, `sw.js`, `manifest.webmanifest`, hashed JS/CSS, and all PWA icons.

```bash
pnpm preview
```

Open the printed URL. In DevTools → Application: confirm "Service Workers" shows one activated worker, and "Manifest" shows the Wattblock manifest with all four icons. Stop preview with Ctrl-C.

- [ ] **Step 8: Commit**

```bash
git add public/ pwa-assets.config.ts vite.config.ts index.html src/main.ts
git commit -m "feat(pwa): wire up vite-plugin-pwa, manifest, and generated icons"
```

---

## Task 10: Render — setup screen

**Files:**
- Create: `src/render.ts`

- [ ] **Step 1: Create `src/render.ts` with the setup screen renderer**

```ts
import type { AppState, TeamId } from "./state";

const html = (s: TemplateStringsArray, ...vals: unknown[]): string =>
  s.reduce<string>((acc, part, i) => acc + part + (i < vals.length ? escape(vals[i]) : ""), "");

function escape(v: unknown): string {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const TARGET_PRESETS = [11, 15, 18];

export function render(state: AppState, root: HTMLElement): void {
  root.innerHTML = state.view === "setup" ? renderSetup(state) : renderScoring(state);
}

function renderSetup(state: AppState): string {
  const { target, teamA, teamB } = state.setup;
  const presetChips = TARGET_PRESETS.map(
    (t) =>
      `<button type="button" class="chip ${t === target ? "chip--active" : ""}" data-action="preset-target" data-value="${t}">${t}</button>`,
  ).join("");
  const customActive = !TARGET_PRESETS.includes(target);
  return html`
    <main class="setup">
      <h1 class="setup__title">Wattblock</h1>
      <label class="setup__label">Spielziel</label>
      <div class="chips" role="radiogroup" aria-label="Spielziel">
        ${{ raw: presetChips } as never}
        <input
          type="number"
          min="1"
          inputmode="numeric"
          class="chip chip--input ${customActive ? "chip--active" : ""}"
          value="${customActive ? target : ""}"
          placeholder="…"
          data-action="custom-target"
          aria-label="Eigenes Spielziel"
        />
      </div>

      <label class="setup__label" for="teamA">Team 1</label>
      <input id="teamA" class="setup__input" type="text" value="${teamA}" data-action="team-a" autocomplete="off" />

      <label class="setup__label" for="teamB">Team 2</label>
      <input id="teamB" class="setup__input" type="text" value="${teamB}" data-action="team-b" autocomplete="off" />

      <button
        type="button"
        class="setup__start"
        data-action="start"
        ${!teamA.trim() || !teamB.trim() ? "disabled" : ""}
      >Starten</button>

      ${state.scores.length > 0 ? `<button type="button" class="setup__newmatch" data-action="new-match">Neues Spiel</button>` : ""}
    </main>
  `;
}

function renderScoring(_state: AppState): string {
  return `<main class="scoring">TODO</main>`;
}

export { renderSetup, renderScoring, escape };
export type { TeamId };
```

Notes for the engineer:
- The `html` template tag escapes interpolated values by default. The one place we splice already-built HTML (the chips) uses an `unknown`-cast `{ raw }` placeholder; the next step replaces this with a cleaner pattern. For now, replace the line `${{ raw: presetChips } as never}` with the literal `${presetChips}`, but **first** replace the `escape(vals[i])` call to skip escaping when the value is a `{ raw: string }` object. That dance is not worth it for v1 — instead, simplify by removing the `html` tag entirely and using a normal template literal, since all user-controllable text (`teamA`, `teamB`, the `target` `<input value>`) is already passed through `escape()` explicitly. Use this simpler form:

```ts
function renderSetup(state: AppState): string {
  const { target, teamA, teamB } = state.setup;
  const presetChips = TARGET_PRESETS.map(
    (t) =>
      `<button type="button" class="chip ${t === target ? "chip--active" : ""}" data-action="preset-target" data-value="${t}">${t}</button>`,
  ).join("");
  const customActive = !TARGET_PRESETS.includes(target);
  return `
    <main class="setup">
      <h1 class="setup__title">Wattblock</h1>
      <label class="setup__label">Spielziel</label>
      <div class="chips" role="radiogroup" aria-label="Spielziel">
        ${presetChips}
        <input type="number" min="1" inputmode="numeric"
          class="chip chip--input ${customActive ? "chip--active" : ""}"
          value="${customActive ? target : ""}" placeholder="…"
          data-action="custom-target" aria-label="Eigenes Spielziel" />
      </div>
      <label class="setup__label" for="teamA">Team 1</label>
      <input id="teamA" class="setup__input" type="text" value="${escape(teamA)}" data-action="team-a" autocomplete="off" />
      <label class="setup__label" for="teamB">Team 2</label>
      <input id="teamB" class="setup__input" type="text" value="${escape(teamB)}" data-action="team-b" autocomplete="off" />
      <button type="button" class="setup__start" data-action="start"
        ${!teamA.trim() || !teamB.trim() ? "disabled" : ""}>Starten</button>
      ${state.scores.length > 0 ? `<button type="button" class="setup__newmatch" data-action="new-match">Neues Spiel</button>` : ""}
    </main>
  `;
}
```

Replace the file accordingly: drop the `html` tag, keep `escape`, use plain template literals everywhere user text is interpolated.

- [ ] **Step 2: Wire render into `src/main.ts`**

Replace `src/main.ts`:

```ts
import { registerSW } from "virtual:pwa-register";
import { INITIAL_STATE } from "./state";
import { render } from "./render";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (root) render(INITIAL_STATE, root);
```

- [ ] **Step 3: Verify in browser**

```bash
pnpm dev
```

Open `http://localhost:5173`. Acceptance:
- See "Wattblock" heading.
- See "Spielziel" label and chips `11`, `15` (active), `18`, and an empty `…` input.
- See "Team 1" and "Team 2" inputs (empty).
- "Starten" button is present and disabled (greyed; no styles yet).
- No JS errors in DevTools console.

Stop dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/render.ts src/main.ts
git commit -m "feat(render): add setup screen"
```

---

## Task 11: Render — scoring screen (columns, scores, sums, rails)

**Files:**
- Modify: `src/render.ts`

- [ ] **Step 1: Implement `renderScoring`**

Replace the placeholder `renderScoring` function in `src/render.ts`:

```ts
import { sumFor, isGestrichen, winnerOf } from "./state";

function renderColumn(state: AppState, team: TeamId): string {
  const name = team === "A" ? state.setup.teamA : state.setup.teamB;
  const entries = state.scores.filter((e) => e.team === team);
  const struck = isGestrichen(state, team);
  const isWinner = winnerOf(state) === team;
  const scoresHtml = entries.map((e) => `<li class="col__score">${e.value}</li>`).join("");
  return `
    <section class="col ${struck ? "col--struck" : ""} ${isWinner ? "col--winner" : ""}">
      <h2 class="col__header">${escape(name)}${isWinner ? " <span aria-label='Sieger'>👑</span>" : ""}</h2>
      <ol class="col__scores">${scoresHtml}</ol>
      <div class="col__sum">${sumFor(state, team)}</div>
    </section>
  `;
}

function renderRail(team: TeamId, disabled: boolean): string {
  const cls = (v: string) => `rail__btn rail__btn--${v}`;
  const dis = disabled ? "disabled" : "";
  return `
    <nav class="rail" data-team="${team}" aria-label="Punkte für Team ${team}">
      <button type="button" class="${cls("2")}" data-action="add" data-value="2" ${dis}>2</button>
      <button type="button" class="${cls("3")}" data-action="add" data-value="3" ${dis}>3</button>
      <button type="button" class="${cls("4")}" data-action="add" data-value="4" ${dis}>4</button>
      <button type="button" class="${cls("5")}" data-action="add" data-value="5" ${dis}>5</button>
      <button type="button" class="${cls("neg")}" data-action="add" data-value="-2" ${dis}>−2</button>
      <button type="button" class="${cls("undo")}" data-action="undo" aria-label="Zurück">↶</button>
    </nav>
  `;
}

function renderScoring(state: AppState): string {
  const winner = winnerOf(state);
  const winnerName = winner === "A" ? state.setup.teamA : winner === "B" ? state.setup.teamB : "";
  return `
    <main class="scoring">
      <button type="button" class="scoring__target" data-action="open-setup" aria-label="Einstellungen">
        <span class="scoring__target-label">SPIELZIEL</span>
        <span class="scoring__target-value">${state.setup.target}</span>
      </button>
      <div class="scoring__body">
        ${renderRail("A", winner !== null)}
        ${renderColumn(state, "A")}
        ${renderColumn(state, "B")}
        ${renderRail("B", winner !== null)}
      </div>
      ${
        winner
          ? `<button type="button" class="banner" data-action="new-match">${escape(winnerName)} gewinnen · neues Spiel ↻</button>`
          : ""
      }
    </main>
  `;
}
```

- [ ] **Step 2: Verify by temporarily setting view to scoring in `main.ts`**

For this manual check only — revert after:

```ts
import { INITIAL_STATE, start, addPoint } from "./state";

const demo = addPoint(addPoint(addPoint(start({ ...INITIAL_STATE, setup: { target: 15, teamA: "Tobias & Mark", teamB: "Anna & Peter" } }), "A", 3), "B", 2), "A", 4);

const root = document.querySelector<HTMLDivElement>("#app");
if (root) render(demo, root);
```

```bash
pnpm dev
```

Acceptance:
- See `SPIELZIEL 15` at top.
- Left rail with 6 buttons; right rail with 6 buttons.
- Left column header `Tobias & Mark`, list shows `3`, `4`, sum `7`.
- Right column header `Anna & Peter`, list shows `2`, sum `2`.
- No console errors.

Revert `src/main.ts` to render `INITIAL_STATE`:

```ts
import { registerSW } from "virtual:pwa-register";
import { INITIAL_STATE } from "./state";
import { render } from "./render";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (root) render(INITIAL_STATE, root);
```

- [ ] **Step 3: Commit**

```bash
git add src/render.ts src/main.ts
git commit -m "feat(render): add scoring screen (columns, sums, rails, banner)"
```

---

## Task 12: Wire actions — event delegation, persist, re-render loop

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Replace `src/main.ts` with the full dispatch loop**

```ts
import { registerSW } from "virtual:pwa-register";
import {
  addPoint,
  newMatch,
  openSetup,
  start,
  undo,
  updateSetup,
  type AppState,
  type TeamId,
} from "./state";
import { load, save } from "./storage";
import { render } from "./render";

registerSW({ immediate: true });

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");

let state: AppState = load();

function setState(next: AppState): void {
  if (next === state) return;
  state = next;
  save(state);
  render(state, root!);
}

render(state, root);

function getTeamFromRail(el: Element): TeamId | null {
  const rail = el.closest<HTMLElement>(".rail");
  const t = rail?.dataset.team;
  return t === "A" || t === "B" ? t : null;
}

root.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  if (!action) return;
  switch (action) {
    case "add": {
      const team = getTeamFromRail(target);
      const value = Number(target.dataset.value);
      if (team && Number.isFinite(value)) setState(addPoint(state, team, value));
      break;
    }
    case "undo": {
      const team = getTeamFromRail(target);
      if (team) setState(undo(state, team));
      break;
    }
    case "preset-target": {
      const value = Number(target.dataset.value);
      if (Number.isFinite(value) && value > 0) {
        setState(updateSetup(state, { ...state.setup, target: value }));
      }
      break;
    }
    case "start":
      setState(start(state));
      break;
    case "open-setup":
      setState(openSetup(state));
      break;
    case "new-match":
      setState(newMatch(state));
      break;
  }
});

root.addEventListener("input", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const action = target.dataset.action;
  switch (action) {
    case "custom-target": {
      const value = Number(target.value);
      if (Number.isFinite(value) && value > 0) {
        setState(updateSetup(state, { ...state.setup, target: value }));
      }
      break;
    }
    case "team-a":
      setState(updateSetup(state, { ...state.setup, teamA: target.value }));
      break;
    case "team-b":
      setState(updateSetup(state, { ...state.setup, teamB: target.value }));
      break;
  }
});
```

Important: on `input` events the setup screen re-renders, which would normally steal focus. Skip the re-render when a text/number input fired the change — but DO persist + update state. Modify `setState` callers in the `input` handler to call a focus-preserving variant:

Add this helper above the handlers:

```ts
function setStateNoRender(next: AppState): void {
  if (next === state) return;
  state = next;
  save(state);
}
```

And in the `input` handler, call `setStateNoRender(...)` instead of `setState(...)`. The `team-a` / `team-b` / `custom-target` cases all use it. The "Starten" button's `disabled` attribute will refresh on the next `click` re-render — that's acceptable because the user is going to tap somewhere else anyway to start.

Final `input` handler:

```ts
root.addEventListener("input", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const action = target.dataset.action;
  switch (action) {
    case "custom-target": {
      const value = Number(target.value);
      if (Number.isFinite(value) && value > 0) {
        setStateNoRender(updateSetup(state, { ...state.setup, target: value }));
      }
      break;
    }
    case "team-a":
      setStateNoRender(updateSetup(state, { ...state.setup, teamA: target.value }));
      break;
    case "team-b":
      setStateNoRender(updateSetup(state, { ...state.setup, teamB: target.value }));
      break;
  }
});
```

- [ ] **Step 2: Manual smoke test in browser**

```bash
pnpm dev
```

Acceptance:
1. Type "Tobias" in Team 1 and "Anna" in Team 2 → "Starten" button enables.
2. Tap a preset chip (e.g. 11) → that chip becomes active.
3. Tap "Starten" → switches to scoring screen.
4. Tap `+3` on the left rail → `3` appears in left column, sum `3`.
5. Tap `+2` on the right rail → `2` appears in right column, sum `2`.
6. Tap `↶` on the left rail → the `3` disappears, sum `0`.
7. Tap `SPIELZIEL 11` at the top → returns to setup; names and target preserved.
8. Refresh the browser → still on setup with names "Tobias" / "Anna" and target 11.

Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire event delegation, action dispatch, persist, re-render"
```

---

## Task 13: Styles — `app.css` (light/dark, layout, gestrichen line, compact banner)

**Files:**
- Create: `src/app.css`
- Modify: `src/main.ts` (import the stylesheet)

- [ ] **Step 1: Create `src/app.css`**

```css
:root {
  --bg: #faf7f0;
  --bg-card: #fffdf5;
  --ink: #2b2a26;
  --ink-soft: #7a7669;
  --rule: #e6e0cc;
  --accent: #c8a45a;
  --neg: #b14f3b;
  --undo: #6b6759;
  --disabled: rgba(0, 0, 0, 0.25);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1815;
    --bg-card: #24221d;
    --ink: #faf7f0;
    --ink-soft: #a59e8a;
    --rule: #3a362d;
    --accent: #d2b06b;
    --neg: #c46350;
    --undo: #888373;
    --disabled: rgba(255, 255, 255, 0.25);
  }
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 16px;
  -webkit-tap-highlight-color: transparent;
}

body {
  min-height: 100dvh;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

#app { max-width: 540px; margin: 0 auto; padding: 16px; }

/* SETUP */
.setup { display: flex; flex-direction: column; gap: 8px; }
.setup__title {
  margin: 8px 0 24px;
  text-align: center;
  font-size: 28px;
  letter-spacing: 0.04em;
}
.setup__label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-top: 8px;
}
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  border: 1px solid var(--rule);
  background: var(--bg-card);
  color: var(--ink);
  border-radius: 999px;
  padding: 8px 14px;
  font: inherit;
  cursor: pointer;
  min-height: 40px;
}
.chip--input { width: 80px; text-align: center; }
.chip--active { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.setup__input {
  border: 1px solid var(--rule);
  background: var(--bg-card);
  color: var(--ink);
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  min-height: 44px;
}
.setup__start, .setup__newmatch {
  margin-top: 24px;
  border: 0;
  background: var(--ink);
  color: var(--bg);
  padding: 14px;
  border-radius: 10px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.setup__newmatch {
  background: transparent;
  color: var(--ink-soft);
  border: 1px solid var(--rule);
}
.setup__start:disabled { opacity: 0.4; cursor: not-allowed; }

/* SCORING */
.scoring { display: grid; grid-template-rows: auto 1fr auto; gap: 8px; min-height: calc(100dvh - 32px); }
.scoring__target {
  appearance: none; border: 0; background: transparent;
  display: flex; flex-direction: column; align-items: center; cursor: pointer;
  color: var(--ink); padding: 8px 0;
}
.scoring__target-label { font-size: 11px; letter-spacing: 0.1em; color: var(--ink-soft); }
.scoring__target-value { font-size: 28px; font-weight: 700; }

.scoring__body {
  display: grid;
  grid-template-columns: 44px 1fr 1fr 44px;
  gap: 8px;
  align-items: stretch;
}

.rail { display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 4px 0; }
.rail__btn {
  width: 40px; height: 40px;
  border-radius: 999px;
  border: 0;
  background: var(--accent);
  color: var(--bg);
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
.rail__btn--neg { background: var(--neg); }
.rail__btn--undo { background: var(--undo); font-size: 18px; }
.rail__btn:disabled { opacity: 0.35; cursor: not-allowed; }

.col {
  background: var(--bg-card);
  border: 1px solid var(--rule);
  border-radius: 12px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  position: relative;
  overflow: hidden;
}
.col__header {
  margin: 0;
  padding: 10px 8px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--rule);
}
.col__scores {
  list-style: none;
  margin: 0;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  font-weight: 600;
  position: relative;
  min-height: 60px;
}
.col__score { line-height: 1; }
.col__sum {
  border-top: 2px solid var(--ink);
  text-align: center;
  padding: 10px;
  font-size: 24px;
  font-weight: 700;
}

/* GESTRICHEN: vertical line through the scores list */
.col--struck .col__scores::after {
  content: "";
  position: absolute;
  top: 6px; bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  background: var(--accent);
  border-radius: 2px;
  pointer-events: none;
}

/* COMPACT WINNER BANNER */
.banner {
  display: block;
  width: 100%;
  border: 0;
  background: var(--ink);
  color: var(--bg);
  font: inherit;
  font-weight: 600;
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  margin-top: 4px;
}
```

- [ ] **Step 2: Import CSS in `src/main.ts`**

Add as the first line:

```ts
import "./app.css";
```

- [ ] **Step 3: Manual visual verification**

```bash
pnpm dev
```

Acceptance (on a phone or DevTools narrow viewport — 390 px wide):
1. Setup screen: title centred, chips row legible, inputs full-width, "Starten" button readable.
2. After starting and entering scores so left team's sum reaches `target - 2` (e.g. target 11, entries `5, 4` → sum 9): a thin golden vertical line appears down the centre of the left column passing through both numbers.
3. After entering enough to reach target (e.g. one more `+2`): all rail point buttons dim (disabled), undo buttons remain crisp, and a compact dark banner at the bottom reads `Tobias gewinnen · neues Spiel ↻`. Banner is roughly one button row tall.
4. Switch system dark mode (macOS Appearance → Dark or DevTools emulate prefers-color-scheme dark) — colors invert sensibly.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/main.ts
git commit -m "feat(style): style setup and scoring (gestrichen line, compact banner, light/dark)"
```

---

## Task 14: README + manual test checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with install, dev, deploy, manual test checklist"
```

---

## Task 15: CI — GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (test and build)"
```

---

## Task 16: Final verification + tag v0.1.0

**Files:** none

- [ ] **Step 1: Full clean build**

```bash
rm -rf node_modules dist
pnpm install
pnpm test
pnpm build
pnpm preview
```

Expected:
- `pnpm test` → all suites pass (≥ 23 tests).
- `pnpm build` → succeeds, `dist/` contains the SW + manifest.
- `pnpm preview` → app loads; DevTools shows SW registered.

- [ ] **Step 2: Run the manual test checklist from the README**

Tick every box. Fix any regression. Re-run.

- [ ] **Step 3: Tag the release**

```bash
git tag v0.1.0
```

- [ ] **Step 4: Publish to GitHub + Vercel (only after explicit user approval)**

This step is **not automated**. After everything above passes locally, ask the user to:

1. Confirm repo creation: `gh repo create tsenoner/wattblock --public --source=. --remote=origin --push` (or via web UI).
2. Push tags: `git push --tags`.
3. Visit <https://vercel.com/new>, import the repo, accept defaults (Vite auto-detected). Deploy.

Do not run any of those without an explicit "yes" from the user — they involve creating a public artifact under their account.

---

## Self-Review Notes

- **Spec coverage:** Every numbered section of the spec is covered by at least one task:
  - Setup screen → Task 10; scoring screen → Task 11; styles incl. gestrichen + compact banner → Task 13; PWA pieces → Task 9; persistence → Task 8; state model + reducer + selectors → Tasks 2–7; deployment notes → Task 16; CI → Task 15; testing → Tasks 2–8.
- **Placeholder scan:** No `TBD`, `TODO`, or "implement later" left. The note in Task 10 step 1 about removing the experimental `html` tag is fully spelled out with replacement code.
- **Type consistency:** `addPoint`, `undo`, `updateSetup`, `newMatch`, `start`, `openSetup`, `sumFor`, `isGestrichen`, `winnerOf`, `load`, `save`, `render`, `AppState`, `TeamId`, `Setup`, `ScoreEntry`, `INITIAL_STATE`, `STORAGE_KEY` — all referenced names match their definitions across tasks.
