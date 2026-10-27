"use client";

import { useState } from "react";
import StatusBadge, { STATUS_LABEL } from "@/components/StatusBadge";
import WeeklyPlanSelect, { PlanDateWarning } from "@/components/WeeklyPlanSelect";
import { useDeleteTodo, useUpdateTodo } from "@/hooks/useTodos";
import { useWeeklyPlans } from "@/hooks/useWeeklyPlans";
import type { TodoDTO, TodoStatus } from "@/types/api";

export default function TodoRow({ todo }: { todo: TodoDTO }) {
  const update = useUpdateTodo();
  const del = useDeleteTodo();
  const { data: plans = [] } = useWeeklyPlans();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [date, setDate] = useState(todo.date);
  const [status, setStatus] = useState<TodoStatus>(todo.status);
  const planTitle = plans.find((p) => p.id === todo.weeklyPlanId)?.title;
  // a dangling weeklyPlanId (plan deleted) starts as "연결 안 함"
  const initialPlanId = planTitle ? (todo.weeklyPlanId ?? "") : "";
  const [planId, setPlanId] = useState(initialPlanId);

  function startEdit() {
    setTitle(todo.title);
    setDate(todo.date);
    setStatus(todo.status);
    setPlanId(initialPlanId);
    setEditing(true);
  }

  function save() {
    const t = title.trim();
    if (!t || !date) return;
    update.mutate(
      { id: todo.id, title: t, date, status, weeklyPlanId: planId || null },
      { onSuccess: () => setEditing(false) },
    );
  }

  function remove() {
    if (window.confirm(`"${todo.title}" 할 일을 삭제할까요?`)) del.mutate(todo.id);
  }

  if (editing) {
    return (
      <li className="card flex flex-wrap items-center gap-2 p-3" data-testid="todo-item">
        <input className="input min-w-48 flex-1" aria-label="제목" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" className="input" aria-label="날짜" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input" aria-label="상태" value={status} onChange={(e) => setStatus(e.target.value as TodoStatus)}>
          {(Object.keys(STATUS_LABEL) as TodoStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <WeeklyPlanSelect value={planId} onChange={setPlanId} />
        <button className="btn btn-primary" onClick={save} disabled={update.isPending || !title.trim()}>
          저장
        </button>
        <button className="btn" onClick={() => setEditing(false)}>
          취소
        </button>
        <PlanDateWarning planId={planId} date={date} />
      </li>
    );
  }

  return (
    <li className="card flex flex-wrap items-center gap-3 p-3" data-testid="todo-item">
      <StatusBadge status={todo.status} />
      <span className={`min-w-0 flex-1 break-words ${todo.status === "done" ? "text-muted line-through" : ""}`}>
        {todo.title}
      </span>
      {planTitle && <span className="text-xs text-muted">{planTitle}</span>}
      <span className="text-xs tabular-nums text-muted">{todo.date}</span>
      <button className="btn" onClick={startEdit}>
        수정
      </button>
      <button className="btn btn-danger" onClick={remove} disabled={del.isPending}>
        삭제
      </button>
    </li>
  );
}
