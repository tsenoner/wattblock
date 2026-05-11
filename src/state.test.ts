import { describe, expect, it } from "vitest";
import { INITIAL_STATE, addPoint } from "./state";

describe("INITIAL_STATE", () => {
  it("starts in setup view, target 15, blank names, no scores", () => {
    expect(INITIAL_STATE).toEqual({
      setup: { target: 15, teamA: "", teamB: "" },
      scores: [],
      view: "setup",
    });
  });
});

describe("addPoint", () => {
  it("appends an entry for team A", () => {
    const next = addPoint(INITIAL_STATE, "A", 3);
    expect(next.scores).toEqual([{ team: "A", value: 3 }]);
  });

  it("appends an entry for team B without touching A's entries", () => {
    const after1 = addPoint(INITIAL_STATE, "A", 2);
    const after2 = addPoint(after1, "B", 4);
    expect(after2.scores).toEqual([
      { team: "A", value: 2 },
      { team: "B", value: 4 },
    ]);
  });

  it("returns a new state object (does not mutate input)", () => {
    const next = addPoint(INITIAL_STATE, "A", 2);
    expect(next).not.toBe(INITIAL_STATE);
    expect(INITIAL_STATE.scores).toEqual([]);
  });
});
