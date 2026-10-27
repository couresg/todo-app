"use client";

import { useWeeklyPlans } from "@/hooks/useWeeklyPlans";

interface Props {
  value: string;
  onChange: (v: string) => void;
  noneLabel?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function WeeklyPlanSelect({
  value,
  onChange,
  noneLabel = "연결 안 함",
  label = "주간 계획",
  className = "",
  disabled,
}: Props) {
  const { data = [] } = useWeeklyPlans();
  return (
    <select
      aria-label={label}
      className={`input ${className}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{noneLabel}</option>
      {data.map((p) => (
        <option key={p.id} value={p.id}>
          {p.title} ({p.weekStart}~{p.weekEnd})
        </option>
      ))}
    </select>
  );
}

/** Non-blocking hint when the chosen date falls outside the chosen plan's week (PLAN 9). */
export function PlanDateWarning({ planId, date }: { planId: string; date: string }) {
  const { data = [] } = useWeeklyPlans();
  const plan = data.find((p) => p.id === planId);
  if (!plan || !date || (date >= plan.weekStart && date <= plan.weekEnd)) return null;
  return (
    <p className="w-full text-xs text-muted" role="status">
      선택한 날짜가 주간 계획 기간({plan.weekStart}~{plan.weekEnd}) 밖입니다
    </p>
  );
}
