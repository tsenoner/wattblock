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

export function addPoint(state: AppState, team: TeamId, value: number): AppState {
  return { ...state, scores: [...state.scores, { team, value }] };
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
