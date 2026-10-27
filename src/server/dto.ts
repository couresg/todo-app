import type { Types } from "mongoose";
import type { GoalDTO, TodoDTO, WeeklyPlanDTO } from "@/types/api";
import type { GoalDoc } from "@/models/Goal";
import type { TodoDoc } from "@/models/Todo";
import type { WeeklyPlanDoc } from "@/models/WeeklyPlan";

type WithId<T> = T & { _id: Types.ObjectId };

const iso = (d: Date) => d.toISOString();
const idOrNull = (v: { toString(): string } | null | undefined) => (v ? v.toString() : null);

export function toGoalDTO(doc: WithId<GoalDoc>, progress: number): GoalDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    year: doc.year,
    progress,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toWeeklyPlanDTO(
  doc: WithId<WeeklyPlanDoc>,
  stats: { progress: number; todoCount: number; doneCount: number },
): WeeklyPlanDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    weekStart: doc.weekStart,
    weekEnd: doc.weekEnd,
    goalId: idOrNull(doc.goalId),
    ...stats,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toTodoDTO(doc: WithId<TodoDoc>): TodoDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    date: doc.date,
    status: doc.status ?? "todo",
    sortOrder: doc.sortOrder ?? 0,
    weeklyPlanId: idOrNull(doc.weeklyPlanId),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}
