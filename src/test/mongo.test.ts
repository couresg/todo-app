import { afterAll, beforeAll, expect, it } from "vitest";
import { Todo } from "@/models/Todo";
import { clearTestDb, startTestDb, stopTestDb } from "./mongo";

beforeAll(startTestDb);
afterAll(stopTestDb);

it("test db works with models and defaults", async () => {
  await clearTestDb();
  const t = await Todo.create({ title: "x", date: "2026-10-27" });
  expect(t.status).toBe("todo");
  expect(t.sortOrder).toBe(0);
  expect(t.weeklyPlanId).toBeNull();
});
