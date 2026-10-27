import type { QueryClient } from "@tanstack/react-query";
import type { TodoQuery } from "@/lib/api-client";

export const qk = {
  todos: (q: TodoQuery = {}) => ["todos", q] as const,
  plans: (goalId?: string) => ["weekly-plans", { goalId: goalId ?? null }] as const,
  goals: () => ["goals"] as const,
};

/** Todo changes affect plan/goal progress, so refresh all three (PLAN 2.5 / M5). */
export function invalidateProgress(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["todos"] }),
    qc.invalidateQueries({ queryKey: ["weekly-plans"] }),
    qc.invalidateQueries({ queryKey: ["goals"] }),
  ]);
}
