import { describe, expect, it } from "vitest";
import { INITIAL_STATE, addPoint, sumFor, isGestrichen, winnerOf, type AppState, type TeamId } from "./state";

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

describe("selectors", () => {
  const after = (entries: Array<[TeamId, number]>): AppState =>
    entries.reduce<AppState>((s, [t, v]) => addPoint(s, t, v), INITIAL_STATE);

  it("sumFor adds all entries for the given team", () => {
    const s = after([["A", 3], ["B", 2], ["A", 4]]);
    expect(sumFor(s, "A")).toBe(7);
    expect(sumFor(s, "B")).toBe(2);
  });

  it("sumFor handles negative entries", () => {
    const s = after([["A", 3], ["A", -2]]);
    expect(sumFor(s, "A")).toBe(1);
  });

  it("isGestrichen is true when sum >= target − 2", () => {
    const s = after([["A", 5], ["A", 5], ["A", 3]]); // sum 13, target 15
    expect(isGestrichen(s, "A")).toBe(true);
    expect(isGestrichen(s, "B")).toBe(false);
  });

  it("isGestrichen is false below target − 2", () => {
    const s = after([["A", 5], ["A", 5], ["A", 2]]); // sum 12, target 15
    expect(isGestrichen(s, "A")).toBe(false);
  });

  it("winnerOf returns the team that reached target", () => {
    const s = after([["A", 5], ["A", 5], ["A", 5]]); // sum 15
    expect(winnerOf(s)).toBe("A");
  });

  it("winnerOf returns null before anyone reaches target", () => {
    const s = after([["A", 5], ["B", 4]]);
    expect(winnerOf(s)).toBeNull();
  });

  it("winnerOf returns the team that overshoots target (e.g. via 5-pt win)", () => {
    const s: AppState = { ...INITIAL_STATE, setup: { ...INITIAL_STATE.setup, target: 11 } };
    const after5 = addPoint(addPoint(s, "B", 5), "B", 5); // sum 10
    const winB = addPoint(after5, "B", 5);                 // sum 15 > 11
    expect(winnerOf(winB)).toBe("B");
  });
});
