import { describe, expect, it } from "vitest";
import { addDays, isValidDateString, toWeekStart, todayString, weekEndOf } from "./week";

describe("week", () => {
  it("U4 toWeekStart maps to Monday", () => {
    expect(toWeekStart("2026-10-29")).toBe("2026-10-26");
    expect(toWeekStart("2026-11-01")).toBe("2026-10-26");
    expect(toWeekStart("2026-10-26")).toBe("2026-10-26");
  });
  it("handles month and year boundaries", () => {
    expect(toWeekStart("2026-01-01")).toBe("2025-12-29");
    expect(toWeekStart("2026-03-01")).toBe("2026-02-23");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
  });
  it("weekEndOf is +6 days", () => {
    expect(weekEndOf("2026-10-26")).toBe("2026-11-01");
  });
  it("isValidDateString", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026-1-1")).toBe(false);
  });
  it("todayString has date format", () => {
    expect(isValidDateString(todayString())).toBe(true);
  });
});
