"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import Column from "@/components/board/Column";
import { useMoveTodo, usePendingMoveIds } from "@/hooks/useMoveTodo";
import type { TodoDTO, TodoStatus } from "@/types/api";

const STATUSES: TodoStatus[] = ["todo", "doing", "done"];

function byOrder(a: TodoDTO, b: TodoDTO) {
  return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
}

export default function Board({ todos }: { todos: TodoDTO[] }) {
  const move = useMoveTodo();
  const pendingIds = usePendingMoveIds();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns: Record<TodoStatus, TodoDTO[]> = { todo: [], doing: [], done: [] };
  for (const t of [...todos].sort(byOrder)) columns[t.status].push(t);
  const active = todos.find((t) => t.id === activeId);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active: a, over } = e;
    if (!over) return;
    const id = String(a.id);
    const from = todos.find((t) => t.id === id);
    if (!from) return;

    const overData = over.data.current as { type?: string; status?: TodoStatus } | undefined;
    const target = overData?.status;
    if (!target) return;

    const targetIds = columns[target].map((t) => t.id);
    let orderedIds: string[];
    if (overData?.type === "card") {
      const overId = String(over.id);
      if (overId === id) return;
      if (from.status === target) {
        orderedIds = arrayMove(targetIds, targetIds.indexOf(id), targetIds.indexOf(overId));
      } else {
        const overIndex = targetIds.indexOf(overId);
        const translated = a.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        orderedIds = [...targetIds];
        orderedIds.splice(overIndex + (below ? 1 : 0), 0, id);
      }
    } else {
      // dropped on the column body: append (same column drop is a no-op)
      if (from.status === target) return;
      orderedIds = [...targetIds, id];
    }
    // ONE request persists status + order for the whole target column
    move.mutate({ id, status: target, orderedIds });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((s) => (
          <Column key={s} status={s} todos={columns[s]} pendingIds={pendingIds} />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className="card cursor-grabbing p-3 text-sm shadow-lg">
            <p className="break-words">{active.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
