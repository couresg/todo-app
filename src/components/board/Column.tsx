"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { STATUS_LABEL } from "@/components/StatusBadge";
import TodoCard from "@/components/board/TodoCard";
import type { TodoDTO, TodoStatus } from "@/types/api";

export const columnDropId = (status: TodoStatus) => `column:${status}`;

export default function Column({
  status,
  todos,
  pendingIds,
}: {
  status: TodoStatus;
  todos: TodoDTO[];
  pendingIds: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status), data: { type: "column", status } });

  return (
    <section
      aria-label={STATUS_LABEL[status]}
      className={`flex min-h-64 flex-col rounded-xl border p-3 transition-colors ${
        isOver ? "border-accent bg-accent/5" : "border-line bg-surface/60"
      }`}
    >
      <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">
        {STATUS_LABEL[status]}
        <span className="text-xs font-normal text-muted">{todos.length}</span>
      </h2>
      <div ref={setNodeRef} data-testid={`column-${status}`} className="flex min-h-24 flex-1 flex-col gap-2">
        <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {todos.map((t) => (
            <TodoCard key={t.id} todo={t} disabled={pendingIds.has(t.id)} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
