import type { AppState } from "./state";

const TARGET_PRESETS = [11, 15, 18];

export function render(state: AppState, root: HTMLElement): void {
  root.innerHTML = state.view === "setup" ? renderSetup(state) : renderScoring(state);
}

export function escape(v: unknown): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

function renderScoring(_state: AppState): string {
  return `<main class="scoring">TODO</main>`;
}
