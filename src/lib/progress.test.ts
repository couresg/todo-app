import { describe, expect, it } from "vitest";
import { calcGoalProgress, calcWeeklyProgress } from "./progress";

describe("calcWeeklyProgress", () => {
  it("U1 returns 0 when total is 0", () => {
    expect(calcWeeklyProgress({ done: 0, total: 0 })).toBe(0);
  });
  it("U2 rounds 1/3 and 2/3", () => {
    expect(calcWeeklyProgress({ done: 1, total: 3 })).toBe(33);
    expect(calcWeeklyProgress({ done: 2, total: 3 })).toBe(67);
  });
  it("U3 returns 100 when all done", () => {
    expect(calcWeeklyProgress({ done: 4, total: 4 })).toBe(100);
  });
});

describe("calcGoalProgress", () => {
  it("U5 averages progresses; empty is 0", () => {
    expect(calcGoalProgress([50, 100])).toBe(75);
    expect(calcGoalProgress([])).toBe(0);
  });
});
