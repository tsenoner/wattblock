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
  undone: ScoreEntry[];
  view: "setup" | "scoring";
}

export const INITIAL_STATE: AppState = {
  setup: { target: 15, teamA: "", teamB: "" },
  scores: [],
  undone: [],
  view: "setup",
};

export function addPoint(state: AppState, team: TeamId, value: number): AppState {
  if (winnerOf(state) !== null) return state;
  return {
    ...state,
    scores: [...state.scores, { team, value }],
    undone: [],
  };
}

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

export function undo(state: AppState): AppState {
  if (state.scores.length === 0) return state;
  const last = state.scores[state.scores.length - 1];
  return {
    ...state,
    scores: state.scores.slice(0, -1),
    undone: [...state.undone, last],
  };
}

export function redo(state: AppState): AppState {
  if (state.undone.length === 0) return state;
  const last = state.undone[state.undone.length - 1];
  return {
    ...state,
    scores: [...state.scores, last],
    undone: state.undone.slice(0, -1),
  };
}

export function updateSetup(state: AppState, setup: Setup): AppState {
  return { ...state, setup };
}

export function newMatch(state: AppState): AppState {
  return { ...state, scores: [], undone: [], view: "setup" };
}

export function start(state: AppState): AppState {
  return { ...state, view: "scoring" };
}

export function openSetup(state: AppState): AppState {
  return { ...state, view: "setup" };
}

export function resumeFromPersisted(state: AppState): AppState {
  return winnerOf(state) !== null ? newMatch(state) : state;
}
