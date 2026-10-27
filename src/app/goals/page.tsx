"use client";

import { useState, type FormEvent } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Empty, ErrorBox, Loading } from "@/components/State";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from "@/hooks/useGoals";
import { useWeeklyPlans } from "@/hooks/useWeeklyPlans";
import type { GoalDTO } from "@/types/api";

function GoalForm({ goal, onDone }: { goal?: GoalDTO; onDone?: () => void }) {
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [year, setYear] = useState(String(goal?.year ?? new Date().getFullYear()));
  const pending = create.isPending || update.isPending;

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const y = Number(year);
    if (!t || !Number.isInteger(y)) return;
    if (goal) {
      update.mutate({ id: goal.id, title: t, year: y }, { onSuccess: onDone });
    } else {
      create.mutate({ title: t, year: y }, { onSuccess: () => setTitle("") });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card flex flex-wrap items-center gap-2 p-3"
      aria-label={goal ? "목표 수정" : "목표 추가"}
    >
      <input
        className="input min-w-48 flex-1"
        placeholder="1년 목표 제목"
        aria-label="제목"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="number"
        className="input w-24"
        aria-label="연도"
        min={2000}
        max={2100}
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={pending || !title.trim()}>
        {goal ? "저장" : "추가"}
      </button>
      {goal && (
        <button type="button" className="btn" onClick={onDone}>
          취소
        </button>
      )}
    </form>
  );
}

function GoalItem({ goal, planCount }: { goal: GoalDTO; planCount: number }) {
  const del = useDeleteGoal();
  const [editing, setEditing] = useState(false);

  if (editing) return <GoalForm goal={goal} onDone={() => setEditing(false)} />;

  return (
    <li className="card space-y-2 p-4" data-testid="goal-item">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 flex-1 font-semibold break-words">{goal.title}</h2>
        <span className="text-sm text-muted">{goal.year}년</span>
        <button className="btn" onClick={() => setEditing(true)}>
          수정
        </button>
        <button
          className="btn btn-danger"
          disabled={del.isPending}
          onClick={() => window.confirm(`"${goal.title}" 목표를 삭제할까요? 연결된 주간 계획은 미연결이 됩니다.`) && del.mutate(goal.id)}
        >
          삭제
        </button>
      </div>
      <ProgressBar value={goal.progress} label={`${goal.title} 진행률`} />
      <p className="text-xs text-muted">연결된 주간 계획 {planCount}개</p>
    </li>
  );
}

export default function GoalsPage() {
  const { data, isLoading, error } = useGoals();
  const { data: plans = [] } = useWeeklyPlans();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">1년 목표</h1>
      <GoalForm />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((g) => (
            <GoalItem key={g.id} goal={g} planCount={plans.filter((p) => p.goalId === g.id).length} />
          ))}
        </ul>
      ) : (
        <Empty text="1년 목표가 없습니다" />
      )}
    </div>
  );
}
