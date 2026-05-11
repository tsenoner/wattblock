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
