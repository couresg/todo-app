"use client";

import { useState, type FormEvent } from "react";
import WeeklyPlanSelect, { PlanDateWarning } from "@/components/WeeklyPlanSelect";
import { useCreateTodo } from "@/hooks/useTodos";

export default function TodoForm({ defaultDate }: { defaultDate: string }) {
  const create = useCreateTodo();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [planId, setPlanId] = useState("");
  const shownDate = date ?? defaultDate;

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || !shownDate) return;
    create.mutate(
      { title: t, date: shownDate, weeklyPlanId: planId || null },
      { onSuccess: () => setTitle("") },
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-wrap items-center gap-2 p-3" aria-label="할 일 추가">
      <input
        className="input min-w-48 flex-1"
        placeholder="새 할 일"
        aria-label="제목"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="date"
        className="input"
        aria-label="날짜"
        value={shownDate}
        onChange={(e) => setDate(e.target.value)}
      />
      <WeeklyPlanSelect value={planId} onChange={setPlanId} />
      <button type="submit" className="btn btn-primary" disabled={create.isPending || !title.trim() || !shownDate}>
        추가
      </button>
      {!shownDate && (
        <p className="w-full text-xs text-red-600" role="alert">
          날짜를 선택하세요
        </p>
      )}
      <PlanDateWarning planId={planId} date={shownDate} />
    </form>
  );
}
