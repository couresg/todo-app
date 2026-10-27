"use client";

import { useGoals } from "@/hooks/useGoals";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}

export default function GoalSelect({ value, onChange, label = "1년 목표", className = "" }: Props) {
  const { data = [] } = useGoals();
  return (
    <select
      aria-label={label}
      className={`input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">연결 안 함</option>
      {data.map((g) => (
        <option key={g.id} value={g.id}>
          {g.title} ({g.year})
        </option>
      ))}
    </select>
  );
}
