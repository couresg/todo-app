"use client";

import { useState } from "react";
import Board from "@/components/board/Board";
import ProgressBar from "@/components/ProgressBar";
import { ErrorBox, Loading } from "@/components/State";
import WeeklyPlanSelect from "@/components/WeeklyPlanSelect";
import { useTodos } from "@/hooks/useTodos";
import { useWeeklyPlans } from "@/hooks/useWeeklyPlans";
import { todayString } from "@/lib/week";

export default function BoardPage() {
  const [today] = useState(todayString);
  const [picked, setPicked] = useState<string | null>(null);
  const [planId, setPlanId] = useState("");
  const date = picked ?? today;
  // a selected plan overrides the date filter
  const query = planId ? { weeklyPlanId: planId } : { date };
  const { data, isLoading, error } = useTodos(query);
  const { data: plans = [] } = useWeeklyPlans();
  const plan = plans.find((p) => p.id === planId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">보드</h1>
        <input
          type="date"
          className="input"
          aria-label="날짜"
          value={date}
          disabled={!!planId}
          onChange={(e) => e.target.value && setPicked(e.target.value)}
        />
        <WeeklyPlanSelect value={planId} onChange={setPlanId} noneLabel="전체 날짜" label="주간 계획 필터" />
      </div>
      {plan && (
        <div className="card space-y-1 p-3" data-testid="board-plan-progress">
          <p className="text-sm font-semibold">
            {plan.title}{" "}
            <span className="font-normal text-muted">
              ({plan.doneCount}/{plan.todoCount})
            </span>
          </p>
          <ProgressBar value={plan.progress} label={`${plan.title} 진행률`} />
        </div>
      )}
      {isLoading ? <Loading /> : error ? <ErrorBox error={error} /> : <Board todos={data ?? []} />}
    </div>
  );
}
