export type Theme = "auto" | "light" | "dark";

export const THEME_KEY = "wattblock:theme";

const THEMES: readonly Theme[] = ["auto", "light", "dark"];

export function loadTheme(): Theme {
  const raw = localStorage.getItem(THEME_KEY);
  return (THEMES as readonly string[]).includes(raw ?? "") ? (raw as Theme) : "auto";
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function nextTheme(theme: Theme): Theme {
  return theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
