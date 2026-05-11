import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_STATE, type AppState } from "./state";
import { load, save, STORAGE_KEY } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("load returns INITIAL_STATE when nothing is stored", () => {
    expect(load()).toEqual(INITIAL_STATE);
  });

  it("save then load round-trips the state", () => {
    const s: AppState = {
      setup: { target: 11, teamA: "X", teamB: "Y" },
      scores: [{ team: "A", value: 3 }],
      undone: [],
      view: "scoring",
    };
    save(s);
    expect(load()).toEqual(s);
  });

  it("load returns INITIAL_STATE when stored JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(load()).toEqual(INITIAL_STATE);
  });

  it("load returns INITIAL_STATE when stored shape is wrong", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(load()).toEqual(INITIAL_STATE);
  });

  it("load tolerates persisted state missing the undone field (v0.1.1 migration)", () => {
    const legacy = {
      setup: { target: 11, teamA: "X", teamB: "Y" },
      scores: [{ team: "A", value: 3 }],
      view: "scoring",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    expect(load()).toEqual({
      setup: { target: 11, teamA: "X", teamB: "Y" },
      scores: [{ team: "A", value: 3 }],
      undone: [],
      view: "scoring",
    });
  });
});
