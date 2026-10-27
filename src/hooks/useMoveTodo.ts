"use client";

import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api-client";
import { invalidateProgress } from "@/lib/query";
import type { TodoDTO, TodoStatus } from "@/types/api";

export interface MoveVars {
  /** the card that was dragged */
  id: string;
  /** target column and its full new id order (moved id included) */
  status: TodoStatus;
  orderedIds: string[];
}

const MOVE_KEY = ["move-todo"];
type Snapshot = [readonly unknown[], TodoDTO[] | undefined][];

/**
 * Cross-column move and in-column reorder share one request:
 * PATCH /api/todos/reorder sets the status of the dragged id and re-slots the sortOrder of every listed id.
 * Optimistic update with rollback (PLAN 2.5).
 */
export function useMoveTodo() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: MOVE_KEY,
    scope: { id: "move-todo" }, // moves run serially so they cannot overwrite each other
    mutationFn: (v: MoveVars) => api.todos.reorder(v.status, v.orderedIds, v.id),
    // onMutate runs at mutate() time even when the request is queued behind another move
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const snapshot: Snapshot = qc.getQueriesData<TodoDTO[]>({ queryKey: ["todos"] });
      // same slotting as the server: reuse the listed cards' own sortOrder values in the new order
      const current = new Map<string, number>();
      for (const [, data] of snapshot) data?.forEach((t) => current.set(t.id, t.sortOrder));
      const values = v.orderedIds.map((id) => current.get(id) ?? 0).sort((a, b) => a - b);
      const slot = new Map<string, number>();
      v.orderedIds.forEach((id, i) => {
        slot.set(id, i ? Math.max(slot.get(v.orderedIds[i - 1])! + 1, values[i]) : values[i]);
      });
      qc.setQueriesData<TodoDTO[]>({ queryKey: ["todos"] }, (old) =>
        old?.map((t) =>
          slot.has(t.id)
            ? { ...t, status: t.id === v.id ? v.status : t.status, sortOrder: slot.get(t.id)! }
            : t,
        ),
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast("저장에 실패했습니다. 원래 위치로 되돌렸습니다.");
    },
    onSettled: () => {
      // refetch only once the last queued move has settled
      if (qc.isMutating({ mutationKey: MOVE_KEY }) <= 1) invalidateProgress(qc);
    },
  });
}

/** Ids of cards whose move request is still in flight. */
export function usePendingMoveIds(): Set<string> {
  const vars = useMutationState({
    filters: { mutationKey: MOVE_KEY, status: "pending" },
    select: (m) => (m.state.variables as MoveVars).id,
  });
  return new Set(vars);
}

/** In-column reorder uses the same mutation. */
export const useReorderTodos = useMoveTodo;
