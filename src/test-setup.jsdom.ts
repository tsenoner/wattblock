// Vitest setup file.
//
// Node 22+ exposes an experimental `localStorage` global that requires
// `--localstorage-file`. In Vitest 2.x the jsdom environment proxies
// `globalThis.localStorage` through a getter that, in the presence of the
// Node experimental global, resolves to `undefined`. We bypass it by copying
// the JSDOM instance's working `localStorage` (and `sessionStorage`) directly
// onto `globalThis` so tests can use them like in a browser.
//
// This file is configured via `test.setupFiles` in `vite.config.ts`. It runs
// for every test file, including ones running under the `node` environment,
// so it must no-op when JSDOM is not active.

const g = globalThis as { jsdom?: { window?: Record<string, unknown> } };
const win = g.jsdom?.window;

if (win) {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    const value = win[key];
    if (value !== undefined) {
      Object.defineProperty(globalThis, key, {
        value,
        configurable: true,
        writable: true,
      });
    }
  }
}

export {};
