import { sumFor, isGestrichen, winnerOf, type AppState, type TeamId } from "./state";
import { loadTheme, type Theme } from "./theme";

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

function renderThemeToggle(theme: Theme): string {
  const glyph =
    theme === "light" ? renderSunGlyph()
    : theme === "dark" ? renderMoonGlyph()
    : renderAutoGlyph();
  return `
    <button type="button" class="theme-toggle" data-action="cycle-theme"
            aria-label="Theme: ${theme}" title="Theme">
      ${glyph}
    </button>
  `;
}

function renderSunGlyph(): string {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" fill="currentColor"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="M4.93 4.93l1.41 1.41"/>
      <path d="M17.66 17.66l1.41 1.41"/>
      <path d="M4.93 19.07l1.41-1.41"/>
      <path d="M17.66 6.34l1.41-1.41"/>
    </svg>
  `;
}

function renderMoonGlyph(): string {
  return `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;
}

function renderAutoGlyph(): string {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>
    </svg>
  `;
}

function renderSetup(state: AppState): string {
  const { target, teamA, teamB } = state.setup;
  const theme = loadTheme();
  const presetChips = TARGET_PRESETS.map(
    (t) =>
      `<button type="button" class="chip ${t === target ? "chip--active" : ""}" data-action="preset-target" data-value="${t}">${t}</button>`,
  ).join("");
  const customActive = !TARGET_PRESETS.includes(target);
  return `
    <main class="setup">
      <div class="setup__chrome">${renderThemeToggle(theme)}</div>
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
      <input id="teamA" class="setup__input" type="text" value="${escape(teamA)}" placeholder="Team 1" data-action="team-a" autocomplete="off" />
      <label class="setup__label" for="teamB">Team 2</label>
      <input id="teamB" class="setup__input" type="text" value="${escape(teamB)}" placeholder="Team 2" data-action="team-b" autocomplete="off" />
      ${state.scores.length > 0
        ? `
          <button type="button" class="setup__start" data-action="start">Spiel fortsetzen</button>
          <button type="button" class="setup__newmatch" data-action="new-match">Neues Spiel</button>
        `
        : `<button type="button" class="setup__start" data-action="start">Starten</button>`}
    </main>
  `;
}

function renderColumn(state: AppState, team: TeamId): string {
  const stored = team === "A" ? state.setup.teamA : state.setup.teamB;
  const name = stored || (team === "A" ? "Team 1" : "Team 2");
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
      <button type="button" class="${cls("undo")}" data-action="undo" aria-label="Zurück">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>
        </svg>
      </button>
    </nav>
  `;
}

function renderScoring(state: AppState): string {
  const winner = winnerOf(state);
  const winnerName =
    winner === "A" ? (state.setup.teamA || "Team 1")
    : winner === "B" ? (state.setup.teamB || "Team 2")
    : "";
  return `
    <main class="scoring">
      <div class="scoring__chrome">
        ${renderThemeToggle(loadTheme())}
        <button type="button" class="scoring__settings" data-action="open-setup" aria-label="Einstellungen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
      <div class="scoring__target">
        <span class="scoring__target-label">SPIELZIEL</span>
        <span class="scoring__target-value">${state.setup.target}</span>
      </div>
      <div class="scoring__body">
        ${renderRail("A", winner !== null)}
        ${renderColumn(state, "A")}
        ${renderColumn(state, "B")}
        ${renderRail("B", winner !== null)}
      </div>
      ${
        winner
          ? `<button type="button" class="banner" data-action="play-again">${escape(winnerName)} gewinnen <span aria-hidden="true">↻</span> neues Spiel</button>`
          : ""
      }
    </main>
  `;
}
