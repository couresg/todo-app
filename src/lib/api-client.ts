import type {
  GoalCreateBody,
  GoalDTO,
  GoalUpdateBody,
  TodoCreateBody,
  TodoDTO,
  TodoStatus,
  TodoUpdateBody,
  WeeklyPlanCreateBody,
  WeeklyPlanDTO,
  WeeklyPlanUpdateBody,
} from "@/types/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) {
    let message = `요청에 실패했습니다 (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body: keep the default message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export interface TodoQuery {
  date?: string;
  weeklyPlanId?: string;
  unlinked?: boolean;
}

export const api = {
  goals: {
    list: () => request<GoalDTO[]>("/api/goals"),
    create: (b: GoalCreateBody) => request<GoalDTO>("/api/goals", json("POST", b)),
    update: (id: string, b: GoalUpdateBody) =>
      request<GoalDTO>(`/api/goals/${id}`, json("PATCH", b)),
    remove: (id: string) => request<void>(`/api/goals/${id}`, { method: "DELETE" }),
  },
  plans: {
    list: (goalId?: string) =>
      request<WeeklyPlanDTO[]>(`/api/weekly-plans${goalId ? `?goalId=${goalId}` : ""}`),
    create: (b: WeeklyPlanCreateBody) =>
      request<WeeklyPlanDTO>("/api/weekly-plans", json("POST", b)),
    update: (id: string, b: WeeklyPlanUpdateBody) =>
      request<WeeklyPlanDTO>(`/api/weekly-plans/${id}`, json("PATCH", b)),
    remove: (id: string) => request<void>(`/api/weekly-plans/${id}`, { method: "DELETE" }),
  },
  todos: {
    list: (q: TodoQuery = {}) => {
      const p = new URLSearchParams();
      if (q.date) p.set("date", q.date);
      if (q.weeklyPlanId) p.set("weeklyPlanId", q.weeklyPlanId);
      if (q.unlinked) p.set("unlinked", "true");
      const qs = p.toString();
      return request<TodoDTO[]>(`/api/todos${qs ? `?${qs}` : ""}`);
    },
    create: (b: TodoCreateBody) => request<TodoDTO>("/api/todos", json("POST", b)),
    update: (id: string, b: TodoUpdateBody) =>
      request<TodoDTO>(`/api/todos/${id}`, json("PATCH", b)),
    remove: (id: string) => request<void>(`/api/todos/${id}`, { method: "DELETE" }),
    reorder: (status: TodoStatus, orderedIds: string[], movedId?: string) =>
      request<{ ok: true }>("/api/todos/reorder", json("PATCH", { status, orderedIds, movedId })),
  },
};
