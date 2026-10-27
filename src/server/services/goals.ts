import { calcGoalProgress } from "@/lib/progress";
import { Goal } from "@/models/Goal";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { toGoalDTO } from "@/server/dto";
import { HttpError } from "@/server/http";
import { planStats } from "@/server/services/weeklyPlans";
import type { GoalCreateBody, GoalDTO, GoalUpdateBody } from "@/types/api";

type GoalLean = Parameters<typeof toGoalDTO>[0];

async function goalProgresses(goals: GoalLean[]): Promise<Map<string, number>> {
  const plans = await WeeklyPlan.find({ goalId: { $in: goals.map((g) => g._id) } })
    .lean();
  const stats = await planStats(plans.map((p) => p._id));
  const byGoal = new Map<string, number[]>();
  for (const p of plans) {
    const key = String(p.goalId);
    const arr = byGoal.get(key) ?? [];
    arr.push(stats.get(String(p._id))!.progress);
    byGoal.set(key, arr);
  }
  return new Map(goals.map((g) => [String(g._id), calcGoalProgress(byGoal.get(String(g._id)) ?? [])]));
}

export async function listGoals(): Promise<GoalDTO[]> {
  const docs = await Goal.find().sort({ year: -1, createdAt: 1 }).lean();
  const progress = await goalProgresses(docs);
  return docs.map((d) => toGoalDTO(d, progress.get(String(d._id))!));
}

async function toDTO(doc: GoalLean): Promise<GoalDTO> {
  const progress = await goalProgresses([doc]);
  return toGoalDTO(doc, progress.get(String(doc._id))!);
}

export async function getGoal(id: string): Promise<GoalDTO> {
  const doc = await Goal.findById(id).lean();
  if (!doc) throw new HttpError(404, "Goal not found");
  return toDTO(doc);
}

export async function createGoal(input: GoalCreateBody): Promise<GoalDTO> {
  const doc = await Goal.create(input);
  return getGoal(doc.id);
}

export async function updateGoal(id: string, input: GoalUpdateBody): Promise<GoalDTO> {
  const doc = await Goal.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after" }).lean();
  if (!doc) throw new HttpError(404, "Goal not found");
  return toDTO(doc);
}

export async function deleteGoal(id: string): Promise<void> {
  const res = await Goal.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw new HttpError(404, "Goal not found");
  await WeeklyPlan.updateMany({ goalId: id }, { $set: { goalId: null } });
}
