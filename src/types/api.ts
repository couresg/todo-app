import type { z } from "zod";
import type { TodoStatus } from "@/models/Todo";
import type {
  goalCreateSchema,
  goalUpdateSchema,
  todoCreateSchema,
  todoReorderSchema,
  todoUpdateSchema,
  weeklyPlanCreateSchema,
  weeklyPlanUpdateSchema,
} from "@/lib/validation";

export type { TodoStatus };

export interface GoalDTO {
  id: string;
  title: string;
  year: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanDTO {
  id: string;
  title: string;
  weekStart: string;
  weekEnd: string;
  goalId: string | null;
  progress: number;
  todoCount: number;
  doneCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoDTO {
  id: string;
  title: string;
  date: string;
  status: TodoStatus;
  sortOrder: number;
  weeklyPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export type GoalCreateBody = z.infer<typeof goalCreateSchema>;
export type GoalUpdateBody = z.infer<typeof goalUpdateSchema>;
export type WeeklyPlanCreateBody = z.infer<typeof weeklyPlanCreateSchema>;
export type WeeklyPlanUpdateBody = z.infer<typeof weeklyPlanUpdateSchema>;
export type TodoCreateBody = z.infer<typeof todoCreateSchema>;
export type TodoUpdateBody = z.infer<typeof todoUpdateSchema>;
export type TodoReorderBody = z.infer<typeof todoReorderSchema>;
