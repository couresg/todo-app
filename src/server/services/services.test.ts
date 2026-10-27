import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { clearTestDb, startTestDb, stopTestDb } from "@/test/mongo";
import { HttpError } from "@/server/http";
import { createGoal, deleteGoal, listGoals } from "@/server/services/goals";
import {
  createWeeklyPlan,
  deleteWeeklyPlan,
  getWeeklyPlan,
  listWeeklyPlans,
  updateWeeklyPlan,
} from "@/server/services/weeklyPlans";
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  reorderTodos,
  updateTodo,
} from "@/server/services/todos";

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const D = "2026-10-27";
const newId = () => new mongoose.Types.ObjectId().toString();
const status = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    if (e instanceof HttpError) return e.status;
    throw e;
  }
  return 0;
};
const plan = (title = "w") => createWeeklyPlan({ title, weekStart: D });

describe("todos", () => {
  it("I1 defaults status to todo", async () => {
    const t = await createTodo({ title: "a", date: D });
    expect(t.status).toBe("todo");
    expect(t.weeklyPlanId).toBeNull();
    expect(typeof t.id).toBe("string");
  });

  it("assigns increasing sortOrder", async () => {
    const a = await createTodo({ title: "a", date: D });
    const b = await createTodo({ title: "b", date: D });
    expect(b.sortOrder).toBe(a.sortOrder + 1);
  });

  it("I7 rejects unknown weeklyPlanId on create and update", async () => {
    expect(await status(createTodo({ title: "a", date: D, weeklyPlanId: newId() }))).toBe(400);
    const t = await createTodo({ title: "a", date: D });
    expect(await status(updateTodo(t.id, { weeklyPlanId: newId() }))).toBe(400);
  });

  it("I8 404 for missing todo", async () => {
    expect(await status(updateTodo(newId(), { title: "x" }))).toBe(404);
    expect(await status(deleteTodo(newId()))).toBe(404);
    expect(await status(getTodo(newId()))).toBe(404);
  });

  it("filters by date, weeklyPlanId, and combination", async () => {
    const p = await plan();
    await createTodo({ title: "a", date: D, weeklyPlanId: p.id });
    await createTodo({ title: "b", date: "2026-10-28", weeklyPlanId: p.id });
    await createTodo({ title: "c", date: D });
    expect(await listTodos()).toHaveLength(3);
    expect((await listTodos({ date: D })).map((t) => t.title)).toEqual(["a", "c"]);
    expect(await listTodos({ weeklyPlanId: p.id })).toHaveLength(2);
    expect((await listTodos({ date: D, weeklyPlanId: p.id })).map((t) => t.title)).toEqual(["a"]);
  });

  it("I10 unlinked = null or dangling plan", async () => {
    const p = await plan();
    await createTodo({ title: "linked", date: D, weeklyPlanId: p.id });
    await createTodo({ title: "null", date: D });
    const dangling = await createTodo({ title: "dangling", date: D });
    await mongoose.connection
      .collection("todos")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(dangling.id) },
        { $set: { weeklyPlanId: new mongoose.Types.ObjectId() } },
      );
    const titles = (await listTodos({ unlinked: true })).map((t) => t.title);
    expect(titles).toEqual(["null", "dangling"]);
    expect((await listTodos({ unlinked: true, date: "2030-01-01" }))).toHaveLength(0);
  });

  it("reorder re-slots sortOrder; unknown ids -> 400", async () => {
    const a = await createTodo({ title: "a", date: D });
    const b = await createTodo({ title: "b", date: D });
    const c = await createTodo({ title: "c", date: D });
    await reorderTodos("todo", [c.id, a.id, b.id], c.id);
    const list = await listTodos();
    expect(list.map((t) => t.title)).toEqual(["c", "a", "b"]);
    expect(list.map((t) => t.sortOrder)).toEqual([0, 1, 2]);
    expect(list.every((t) => t.status === "todo")).toBe(true);
    expect(await status(reorderTodos("todo", [a.id, newId()]))).toBe(400);
    expect((await getTodo(a.id)).status).toBe("todo");
  });

  it("reorder sets status only on movedId; others that left the column are untouched", async () => {
    const a = await createTodo({ title: "a", date: D });
    const b = await createTodo({ title: "b", date: D });
    const c = await createTodo({ title: "c", date: D });
    await updateTodo(b.id, { status: "done" });
    await reorderTodos("doing", [c.id, a.id, b.id], c.id);
    expect((await getTodo(c.id)).status).toBe("doing");
    expect((await getTodo(a.id)).status).toBe("todo");
    const after = await getTodo(b.id);
    expect(after.status).toBe("done");
    expect(after.sortOrder).toBe(b.sortOrder);
  });

  it("reorder rejects duplicate ids", async () => {
    const a = await createTodo({ title: "a", date: D });
    expect(await status(reorderTodos("todo", [a.id, a.id]))).toBe(400);
  });

  it("reorder within a subset keeps its order relative to todos outside it", async () => {
    const a = await createTodo({ title: "a", date: D });
    const b = await createTodo({ title: "b", date: D });
    const c = await createTodo({ title: "c", date: D });
    const d = await createTodo({ title: "d", date: D });
    await reorderTodos("todo", [d.id, b.id], d.id); // slots 1,3 reassigned: d=1, b=3
    expect((await listTodos()).map((t) => t.title)).toEqual(["a", "d", "c", "b"]);
    expect([a, c].map((t) => t.sortOrder)).toEqual([0, 2]);
  });
});

describe("weekly plans", () => {
  it("normalizes weekStart/weekEnd on create and update", async () => {
    const p = await createWeeklyPlan({ title: "w", weekStart: "2026-10-29" });
    expect([p.weekStart, p.weekEnd]).toEqual(["2026-10-26", "2026-11-01"]);
    const u = await updateWeeklyPlan(p.id, { weekStart: "2026-11-04" });
    expect([u.weekStart, u.weekEnd]).toEqual(["2026-11-02", "2026-11-08"]);
  });

  it("rejects unknown goalId; sorts by weekStart desc; filters by goalId", async () => {
    expect(await status(createWeeklyPlan({ title: "w", weekStart: D, goalId: newId() }))).toBe(400);
    const g = await createGoal({ title: "g", year: 2026 });
    await createWeeklyPlan({ title: "old", weekStart: "2026-10-05", goalId: g.id });
    await createWeeklyPlan({ title: "new", weekStart: "2026-10-26", goalId: g.id });
    await createWeeklyPlan({ title: "other", weekStart: "2026-10-12" });
    expect((await listWeeklyPlans()).map((p) => p.title)).toEqual(["new", "other", "old"]);
    expect((await listWeeklyPlans(g.id)).map((p) => p.title)).toEqual(["new", "old"]);
    expect(await status(updateWeeklyPlan(newId(), { title: "x" }))).toBe(404);
  });

  it("I9 progress is 0 with no todos", async () => {
    const p = await plan();
    expect(p).toMatchObject({ progress: 0, todoCount: 0, doneCount: 0 });
  });

  it("I2 1 of 4 done -> 25", async () => {
    const p = await plan();
    const ts = [];
    for (let i = 0; i < 4; i++) ts.push(await createTodo({ title: `t${i}`, date: D, weeklyPlanId: p.id }));
    await updateTodo(ts[0].id, { status: "done" });
    expect(await getWeeklyPlan(p.id)).toMatchObject({ progress: 25, todoCount: 4, doneCount: 1 });
  });

  it("I3 deleting the done todo -> 0", async () => {
    const p = await plan();
    const ts = [];
    for (let i = 0; i < 4; i++) ts.push(await createTodo({ title: `t${i}`, date: D, weeklyPlanId: p.id }));
    await updateTodo(ts[0].id, { status: "done" });
    await deleteTodo(ts[0].id);
    expect(await getWeeklyPlan(p.id)).toMatchObject({ progress: 0, todoCount: 3, doneCount: 0 });
  });

  it("I4 relinking A -> B updates both", async () => {
    const a = await plan("a");
    const b = await plan("b");
    const t = await createTodo({ title: "t", date: D, weeklyPlanId: a.id });
    await updateTodo(t.id, { status: "done" });
    expect((await getWeeklyPlan(a.id)).progress).toBe(100);
    await updateTodo(t.id, { weeklyPlanId: b.id });
    expect((await getWeeklyPlan(a.id)).progress).toBe(0);
    expect((await getWeeklyPlan(b.id)).progress).toBe(100);
  });

  it("I5 deleting a plan unlinks its todos", async () => {
    const p = await plan();
    const t = await createTodo({ title: "t", date: D, weeklyPlanId: p.id });
    await deleteWeeklyPlan(p.id);
    expect((await getTodo(t.id)).weeklyPlanId).toBeNull();
    expect(await status(deleteWeeklyPlan(p.id))).toBe(404);
  });
});

describe("goals", () => {
  it("lists year desc then createdAt asc, progress = mean of plan progress", async () => {
    const g1 = await createGoal({ title: "g1", year: 2025 });
    const g2 = await createGoal({ title: "g2", year: 2026 });
    const g3 = await createGoal({ title: "g3", year: 2026 });
    const p1 = await createWeeklyPlan({ title: "p1", weekStart: D, goalId: g2.id });
    const p2 = await createWeeklyPlan({ title: "p2", weekStart: "2026-11-02", goalId: g2.id });
    const t = await createTodo({ title: "t", date: D, weeklyPlanId: p1.id });
    await updateTodo(t.id, { status: "done" });
    await createTodo({ title: "u", date: D, weeklyPlanId: p2.id });
    const list = await listGoals();
    expect(list.map((g) => g.title)).toEqual(["g2", "g3", "g1"]);
    expect(list.map((g) => g.progress)).toEqual([50, 0, 0]);
    expect(g1.progress).toBe(0);
    expect(g3.progress).toBe(0);
  });

  it("I6 deleting a goal unlinks its plans", async () => {
    const g = await createGoal({ title: "g", year: 2026 });
    const p = await createWeeklyPlan({ title: "p", weekStart: D, goalId: g.id });
    await deleteGoal(g.id);
    expect((await getWeeklyPlan(p.id)).goalId).toBeNull();
    expect(await status(deleteGoal(g.id))).toBe(404);
  });
});
