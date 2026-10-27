"use client";

import { useState, type FormEvent } from "react";
import GoalSelect from "@/components/GoalSelect";
import ProgressBar from "@/components/ProgressBar";
import { Empty, ErrorBox, Loading } from "@/components/State";
import { useGoals } from "@/hooks/useGoals";
import { useCreatePlan, useDeletePlan, useUpdatePlan, useWeeklyPlans } from "@/hooks/useWeeklyPlans";
import { todayString, toWeekStart } from "@/lib/week";
import type { WeeklyPlanDTO } from "@/types/api";

function PlanForm({ plan, onDone }: { plan?: WeeklyPlanDTO; onDone?: () => void }) {
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const [title, setTitle] = useState(plan?.title ?? "");
  const [weekStart, setWeekStart] = useState(plan?.weekStart ?? "");
  const [goalId, setGoalId] = useState(plan?.goalId ?? "");
  const pending = create.isPending || update.isPending;
  // fresh create form defaults to the current week until the user picks a date
  const start = weekStart || toWeekStart(todayString());

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    const body = { title: t, weekStart: start, goalId: goalId || null };
    if (plan) {
      update.mutate({ id: plan.id, ...body }, { onSuccess: onDone });
    } else {
      create.mutate(body, {
        onSuccess: () => {
          setTitle("");
          setGoalId("");
          setWeekStart("");
        },
      });
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card flex flex-wrap items-center gap-2 p-3"
      aria-label={plan ? "주간 계획 수정" : "주간 계획 추가"}
    >
      <input
        className="input min-w-48 flex-1"
        placeholder="주간 계획 제목"
        aria-label="제목"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="date"
        className="input"
        aria-label="주 시작일"
        value={start}
        onChange={(e) => setWeekStart(e.target.value)}
      />
      <GoalSelect value={goalId} onChange={setGoalId} />
      <button type="submit" className="btn btn-primary" disabled={pending || !title.trim()}>
        {plan ? "저장" : "추가"}
      </button>
      {plan && (
        <button type="button" className="btn" onClick={onDone}>
          취소
        </button>
      )}
    </form>
  );
}

function PlanItem({ plan, goalTitle }: { plan: WeeklyPlanDTO; goalTitle?: string }) {
  const del = useDeletePlan();
  const [editing, setEditing] = useState(false);

  if (editing) return <PlanForm plan={plan} onDone={() => setEditing(false)} />;

  return (
    <li className="card space-y-2 p-4" data-testid="weekly-plan-item">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 flex-1 font-semibold break-words">{plan.title}</h2>
        <button className="btn" onClick={() => setEditing(true)}>
          수정
        </button>
        <button
          className="btn btn-danger"
          disabled={del.isPending}
          onClick={() => window.confirm(`"${plan.title}" 주간 계획을 삭제할까요? 연결된 할 일은 미연결이 됩니다.`) && del.mutate(plan.id)}
        >
          삭제
        </button>
      </div>
      <p className="text-xs text-muted">
        {plan.weekStart} ~ {plan.weekEnd} · {goalTitle ? `목표: ${goalTitle}` : "목표 연결 없음"}
      </p>
      <ProgressBar value={plan.progress} label={`${plan.title} 진행률`} />
      <p className="text-xs text-muted">
        완료 {plan.doneCount} / 전체 {plan.todoCount}
      </p>
    </li>
  );
}

export default function WeeklyPage() {
  const { data, isLoading, error } = useWeeklyPlans();
  const { data: goals = [] } = useGoals();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">주간 계획</h1>
      <PlanForm />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((p) => (
            <PlanItem key={p.id} plan={p} goalTitle={goals.find((g) => g.id === p.goalId)?.title} />
          ))}
        </ul>
      ) : (
        <Empty text="주간 계획이 없습니다" />
      )}
    </div>
  );
}
