import { describe, expect, it } from "vitest";
import { INITIAL_STATE } from "./state";

describe("INITIAL_STATE", () => {
  it("starts in setup view, target 15, blank names, no scores", () => {
    expect(INITIAL_STATE).toEqual({
      setup: { target: 15, teamA: "", teamB: "" },
      scores: [],
      view: "setup",
    });
  });
});
