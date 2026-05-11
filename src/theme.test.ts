// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadTheme, saveTheme, nextTheme, applyTheme, THEME_KEY, type Theme } from "./theme";

describe("nextTheme", () => {
  it("toggles light ↔ dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("loadTheme", () => {
  beforeEach(() => localStorage.clear());

  it("returns light when nothing is stored (jsdom has no system dark preference)", () => {
    expect(loadTheme()).toBe("light");
  });

  it("returns the persisted value when valid", () => {
    localStorage.setItem(THEME_KEY, "dark");
    expect(loadTheme()).toBe("dark");
    localStorage.setItem(THEME_KEY, "light");
    expect(loadTheme()).toBe("light");
  });

  it("falls back to system default when the persisted value is unrecognised", () => {
    localStorage.setItem(THEME_KEY, "neon");
    expect(loadTheme()).toBe("light");
  });

  it("falls back to system default when the persisted value is the legacy 'auto'", () => {
    localStorage.setItem(THEME_KEY, "auto");
    expect(loadTheme()).toBe("light");
  });
});

describe("saveTheme", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips through loadTheme", () => {
    saveTheme("light");
    expect(loadTheme()).toBe("light");
    saveTheme("dark");
    expect(loadTheme()).toBe("dark");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets data-theme=light", () => {
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets data-theme=dark", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("replaces the previous value when called twice", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

describe("Theme type", () => {
  it("accepts the two legal values at the type level", () => {
    const themes: Theme[] = ["light", "dark"];
    expect(themes).toHaveLength(2);
  });
});
