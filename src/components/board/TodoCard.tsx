"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TodoDTO } from "@/types/api";

export default function TodoCard({ todo, disabled }: { todo: TodoDTO; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled,
    data: { type: "card", status: todo.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: "none" }}
      data-testid="todo-card"
      data-id={todo.id}
      aria-busy={disabled || undefined}
      className={`card p-3 text-sm ${disabled ? "opacity-60" : "cursor-grab"} ${isDragging ? "opacity-40" : ""}`}
      {...attributes}
      {...listeners}
    >
      <p className="break-words">{todo.title}</p>
      <p className="mt-1 text-xs tabular-nums text-muted">{todo.date}</p>
    </div>
  );
}
