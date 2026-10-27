import { Todo } from "@/models/Todo";
import type { TodoStatus } from "@/models/Todo";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { toTodoDTO } from "@/server/dto";
import { HttpError, toObjectId } from "@/server/http";
import type { TodoCreateBody, TodoDTO, TodoUpdateBody } from "@/types/api";

export interface TodoFilter {
  date?: string;
  weeklyPlanId?: string;
  unlinked?: boolean;
}

async function assertPlanExists(weeklyPlanId: string | null | undefined) {
  if (weeklyPlanId && !(await WeeklyPlan.exists({ _id: weeklyPlanId }))) {
    throw new HttpError(400, "weeklyPlanId does not exist");
  }
}

export async function listTodos(f: TodoFilter = {}): Promise<TodoDTO[]> {
  const filter: Record<string, unknown> = {};
  if (f.date) filter.date = f.date;
  if (f.weeklyPlanId) filter.weeklyPlanId = toObjectId(f.weeklyPlanId);
  if (f.unlinked) {
    // null OR pointing at a plan that no longer exists (PLAN 2.2)
    const planIds = await WeeklyPlan.distinct("_id");
    filter.$or = [{ weeklyPlanId: null }, { weeklyPlanId: { $nin: planIds } }];
  }
  const docs = await Todo.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
  return docs.map(toTodoDTO);
}

export async function getTodo(id: string): Promise<TodoDTO> {
  const doc = await Todo.findById(id).lean();
  if (!doc) throw new HttpError(404, "Todo not found");
  return toTodoDTO(doc);
}

export async function createTodo(input: TodoCreateBody): Promise<TodoDTO> {
  await assertPlanExists(input.weeklyPlanId);
  const last = await Todo.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
  const doc = await Todo.create({
    title: input.title,
    date: input.date,
    status: "todo",
    sortOrder: (last?.sortOrder ?? -1) + 1,
    weeklyPlanId: input.weeklyPlanId ?? null,
  });
  return toTodoDTO(doc.toObject());
}

export async function updateTodo(id: string, input: TodoUpdateBody): Promise<TodoDTO> {
  await assertPlanExists(input.weeklyPlanId);
  const doc = await Todo.findByIdAndUpdate(id, { $set: input }, { returnDocument: "after" }).lean();
  if (!doc) throw new HttpError(404, "Todo not found");
  return toTodoDTO(doc);
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await Todo.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw new HttpError(404, "Todo not found");
}

export async function reorderTodos(
  status: TodoStatus,
  orderedIds: string[],
  movedId?: string,
): Promise<void> {
  if (orderedIds.length === 0) return;
  if (new Set(orderedIds).size !== orderedIds.length) throw new HttpError(400, "Duplicate id in orderedIds");
  const docs = await Todo.find({ _id: { $in: orderedIds } }).select("sortOrder").lean();
  if (docs.length !== orderedIds.length) throw new HttpError(400, "Unknown todo id in orderedIds");
  // reuse the subset's own sortOrder values (made strictly increasing) so order vs todos outside it is kept
  const slots: number[] = [];
  for (const v of docs.map((d) => d.sortOrder).sort((a, b) => a - b)) {
    slots.push(slots.length ? Math.max(slots[slots.length - 1] + 1, v) : v);
  }
  await Todo.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne:
        id === movedId
          ? { filter: { _id: id }, update: { $set: { status, sortOrder: slots[index] } } }
          : { filter: { _id: id, status }, update: { $set: { sortOrder: slots[index] } } },
    })),
  );
}
