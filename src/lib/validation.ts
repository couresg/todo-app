import { z } from "zod";
import { isValidDateString } from "@/lib/week";
import { TODO_STATUSES } from "@/models/Todo";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
export const dateStringSchema = z
  .string()
  .refine(isValidDateString, "Invalid date (expected YYYY-MM-DD)");
const statusSchema = z.enum(TODO_STATUSES);
const titleSchema = (max: number) => z.string().trim().min(1).max(max);
const nullableId = objectIdSchema.nullable();

export const goalCreateSchema = z.object({
  title: titleSchema(100),
  year: z.number().int().min(2000).max(2100),
});
export const goalUpdateSchema = goalCreateSchema.partial();

export const weeklyPlanCreateSchema = z.object({
  title: titleSchema(100),
  weekStart: dateStringSchema,
  goalId: nullableId.optional(),
});
export const weeklyPlanUpdateSchema = weeklyPlanCreateSchema.partial();

export const todoCreateSchema = z.object({
  title: titleSchema(200),
  date: dateStringSchema,
  weeklyPlanId: nullableId.optional(),
});
export const todoUpdateSchema = z.object({
  title: titleSchema(200).optional(),
  date: dateStringSchema.optional(),
  status: statusSchema.optional(),
  weeklyPlanId: nullableId.optional(),
  sortOrder: z.number().int().optional(),
});
export const todoReorderSchema = z
  .object({
    status: statusSchema,
    orderedIds: z.array(objectIdSchema),
    movedId: objectIdSchema.optional(),
  })
  .refine((v) => new Set(v.orderedIds).size === v.orderedIds.length, "Duplicate id in orderedIds")
  .refine((v) => !v.movedId || v.orderedIds.includes(v.movedId), "movedId must be in orderedIds");
