import { describe, expect, it } from "vitest";
import {
  dateStringSchema,
  goalCreateSchema,
  todoCreateSchema,
  todoReorderSchema,
  todoUpdateSchema,
} from "./validation";

describe("validation", () => {
  it("U6 rejects invalid status", () => {
    expect(todoUpdateSchema.safeParse({ status: "finished" }).success).toBe(false);
    expect(todoUpdateSchema.safeParse({ status: "doing" }).success).toBe(true);
  });
  it("U6 rejects empty title", () => {
    expect(todoCreateSchema.safeParse({ title: "  ", date: "2026-10-27" }).success).toBe(false);
    expect(goalCreateSchema.safeParse({ title: "", year: 2026 }).success).toBe(false);
  });
  it("U6 rejects invalid dates", () => {
    expect(dateStringSchema.safeParse("2026-13-01").success).toBe(false);
    expect(dateStringSchema.safeParse("2026-02-30").success).toBe(false);
    expect(dateStringSchema.safeParse("2026-10-27").success).toBe(true);
  });
  it("accepts nullable weeklyPlanId and rejects bad ObjectId", () => {
    const base = { title: "a", date: "2026-10-27" };
    expect(todoCreateSchema.safeParse({ ...base, weeklyPlanId: null }).success).toBe(true);
    expect(todoCreateSchema.safeParse({ ...base, weeklyPlanId: "xyz" }).success).toBe(false);
  });
  it("trims title", () => {
    expect(todoCreateSchema.parse({ title: "  hi ", date: "2026-10-27" }).title).toBe("hi");
  });
  it("reorder schema", () => {
    expect(todoReorderSchema.safeParse({ status: "todo", orderedIds: ["a".repeat(24)] }).success).toBe(true);
    expect(todoReorderSchema.safeParse({ status: "x", orderedIds: [] }).success).toBe(false);
  });
});
