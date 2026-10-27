import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import type { GoalDTO, TodoDTO, WeeklyPlanDTO } from "../src/types/api";

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

/** Clean slate via the public API (children first). */
export async function resetData(request: APIRequestContext) {
  for (const path of ["todos", "weekly-plans", "goals"]) {
    const res = await request.get(`/api/${path}`);
    const items = (await res.json()) as { id: string }[];
    for (const it of items) {
      const del = await request.delete(`/api/${path}/${it.id}`);
      expect(del.status()).toBe(204);
    }
  }
}

export async function createGoal(request: APIRequestContext, title = "Goal") {
  const res = await request.post("/api/goals", { data: { title, year: new Date().getFullYear() } });
  expect(res.status()).toBe(201);
  return (await res.json()) as GoalDTO;
}

export async function createPlan(request: APIRequestContext, title = "Plan", goalId: string | null = null) {
  const res = await request.post("/api/weekly-plans", { data: { title, weekStart: weekStart(today()), goalId } });
  expect(res.status()).toBe(201);
  return (await res.json()) as WeeklyPlanDTO;
}

export async function createTodo(
  request: APIRequestContext,
  title: string,
  weeklyPlanId: string | null = null,
  date = today(),
) {
  const res = await request.post("/api/todos", { data: { title, date, weeklyPlanId } });
  expect(res.status()).toBe(201);
  return (await res.json()) as TodoDTO;
}

/** Manual pointer drag (dnd-kit PointerSensor needs real movement past 5px). */
export async function drag(page: Page, source: Locator, target: Locator) {
  const s = await source.boundingBox();
  const t = await target.boundingBox();
  if (!s || !t) throw new Error("drag: element not visible");
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2 + 10, s.y + s.height / 2 + 10, { steps: 5 });
  await page.mouse.move(t.x + t.width / 2, t.y + Math.min(t.height / 2, 40), { steps: 20 });
  await page.mouse.up();
}

export const column = (page: Page, status: "todo" | "doing" | "done") => page.getByTestId(`column-${status}`);
