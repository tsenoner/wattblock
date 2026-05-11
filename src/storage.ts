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
