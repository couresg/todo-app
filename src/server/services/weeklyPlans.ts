import { calcWeeklyProgress } from "@/lib/progress";
import { toWeekStart, weekEndOf } from "@/lib/week";
import { Goal } from "@/models/Goal";
import { Todo } from "@/models/Todo";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { toWeeklyPlanDTO } from "@/server/dto";
import { HttpError, toObjectId } from "@/server/http";
import type { WeeklyPlanCreateBody, WeeklyPlanDTO, WeeklyPlanUpdateBody } from "@/types/api";

type Stats = { progress: number; todoCount: number; doneCount: number };
type PlanDoc = Parameters<typeof toWeeklyPlanDTO>[0];

/** One aggregate over todos for all given plans (no per-plan queries). */
export async function planStats(ids: PlanDoc["_id"][]): Promise<Map<string, Stats>> {
  const rows = await Todo.aggregate<{ _id: { plan: unknown; status: string }; count: number }>([
    { $match: { weeklyPlanId: { $in: ids } } },
    { $group: { _id: { plan: "$weeklyPlanId", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const acc = new Map<string, { total: number; done: number }>();
  for (const r of rows) {
    const key = String(r._id.plan);
    const cur = acc.get(key) ?? { total: 0, done: 0 };
    cur.total += r.count;
    if (r._id.status === "done") cur.done += r.count;
    acc.set(key, cur);
  }
  const out = new Map<string, Stats>();
  for (const id of ids) {
    const { total, done } = acc.get(String(id)) ?? { total: 0, done: 0 };
    out.set(String(id), {
      progress: calcWeeklyProgress({ done, total }),
      todoCount: total,
      doneCount: done,
    });
  }
  return out;
}

async function assertGoalExists(goalId: string | null | undefined) {
  if (goalId && !(await Goal.exists({ _id: goalId }))) {
    throw new HttpError(400, "goalId does not exist");
  }
}

export async function listWeeklyPlans(goalId?: string): Promise<WeeklyPlanDTO[]> {
  const filter = goalId ? { goalId: toObjectId(goalId) } : {};
  const docs = await WeeklyPlan.find(filter).sort({ weekStart: -1, createdAt: 1 }).lean();
  const stats = await planStats(docs.map((d) => d._id));
  return docs.map((d) => toWeeklyPlanDTO(d, stats.get(String(d._id))!));
}

export async function getWeeklyPlan(id: string): Promise<WeeklyPlanDTO> {
  const doc = await WeeklyPlan.findById(id).lean();
  if (!doc) throw new HttpError(404, "Weekly plan not found");
  const stats = await planStats([doc._id]);
  return toWeeklyPlanDTO(doc, stats.get(String(doc._id))!);
}

export async function createWeeklyPlan(input: WeeklyPlanCreateBody): Promise<WeeklyPlanDTO> {
  await assertGoalExists(input.goalId);
  const weekStart = toWeekStart(input.weekStart);
  const doc = await WeeklyPlan.create({
    title: input.title,
    weekStart,
    weekEnd: weekEndOf(weekStart),
    goalId: input.goalId ?? null,
  });
  return getWeeklyPlan(doc.id);
}

export async function updateWeeklyPlan(
  id: string,
  input: WeeklyPlanUpdateBody,
): Promise<WeeklyPlanDTO> {
  await assertGoalExists(input.goalId);
  const set: Record<string, unknown> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.goalId !== undefined) set.goalId = input.goalId;
  if (input.weekStart !== undefined) {
    const weekStart = toWeekStart(input.weekStart);
    set.weekStart = weekStart;
    set.weekEnd = weekEndOf(weekStart);
  }
  const doc = await WeeklyPlan.findByIdAndUpdate(id, { $set: set }, { returnDocument: "after" }).lean();
  if (!doc) throw new HttpError(404, "Weekly plan not found");
  const stats = await planStats([doc._id]);
  return toWeeklyPlanDTO(doc, stats.get(String(doc._id))!);
}

export async function deleteWeeklyPlan(id: string): Promise<void> {
  const res = await WeeklyPlan.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw new HttpError(404, "Weekly plan not found");
  await Todo.updateMany({ weeklyPlanId: id }, { $set: { weeklyPlanId: null } });
}
