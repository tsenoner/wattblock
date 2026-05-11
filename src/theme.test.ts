// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadTheme, saveTheme, nextTheme, applyTheme, THEME_KEY, type Theme } from "./theme";

describe("nextTheme", () => {
  it("cycles auto → light → dark → auto", () => {
    expect(nextTheme("auto")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("auto");
  });
});

describe("loadTheme", () => {
  beforeEach(() => localStorage.clear());

  it("returns auto when nothing is stored", () => {
    expect(loadTheme()).toBe("auto");
  });

  it("returns the persisted value when valid", () => {
    localStorage.setItem(THEME_KEY, "dark");
    expect(loadTheme()).toBe("dark");
  });

  it("returns auto when the persisted value is unrecognised", () => {
    localStorage.setItem(THEME_KEY, "neon");
    expect(loadTheme()).toBe("auto");
  });
});

describe("saveTheme", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips through loadTheme", () => {
    saveTheme("light");
    expect(loadTheme()).toBe("light");
    saveTheme("dark");
    expect(loadTheme()).toBe("dark");
    saveTheme("auto");
    expect(loadTheme()).toBe("auto");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("removes data-theme when called with auto", () => {
    document.documentElement.setAttribute("data-theme", "light");
    applyTheme("auto");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("sets data-theme=light when called with light", () => {
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets data-theme=dark when called with dark", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});

describe("Theme type", () => {
  it("accepts the three legal values at the type level", () => {
    const themes: Theme[] = ["auto", "light", "dark"];
    expect(themes).toHaveLength(3);
  });
});
