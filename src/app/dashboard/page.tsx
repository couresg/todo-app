"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import ProgressBar from "@/components/ProgressBar";
import { Empty, ErrorBox, Loading } from "@/components/State";
import { useGoals } from "@/hooks/useGoals";
import { useTodos } from "@/hooks/useTodos";
import { useWeeklyPlans } from "@/hooks/useWeeklyPlans";
import { todayString, toWeekStart } from "@/lib/week";
import type { TodoStatus } from "@/types/api";

const STATUS_LABELS: { status: TodoStatus; label: string }[] = [
  { status: "todo", label: "할 일" },
  { status: "doing", label: "진행 중" },
  { status: "done", label: "완료" },
];

function Section({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <section className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-xs text-muted hover:text-accent">
          전체 보기 →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [today] = useState(todayString);
  const weekStart = toWeekStart(today);
  const year = Number(today.slice(0, 4));

  const todos = useTodos({ date: today });
  const unlinked = useTodos({ unlinked: true });
  const plans = useWeeklyPlans();
  const goals = useGoals();

  const weekPlans = plans.data?.filter((p) => p.weekStart === weekStart) ?? [];
  const yearGoals = goals.data?.filter((g) => g.year === year) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-bold">대시보드</h1>
        <span className="text-sm text-muted">{today}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="오늘 할 일" href="/board">
          {todos.isLoading ? (
            <Loading />
          ) : todos.error ? (
            <ErrorBox error={todos.error} />
          ) : (
            <div className="grid grid-cols-3 gap-2" data-testid="dashboard-today">
              {STATUS_LABELS.map(({ status, label }) => (
                <div key={status} className="rounded-lg border border-line p-3 text-center">
                  <div className="text-2xl font-bold tabular-nums">
                    {todos.data?.filter((t) => t.status === status).length ?? 0}
                  </div>
                  <div className="text-xs text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}
          {unlinked.data && unlinked.data.length > 0 && (
            <p className="text-xs text-muted">
              주간 계획에 연결되지 않은 할 일{" "}
              <Link href="/unlinked" className="font-semibold text-accent">
                {unlinked.data.length}개
              </Link>
            </p>
          )}
        </Section>

        <Section title="이번 주 계획" href="/weekly">
          {plans.isLoading ? (
            <Loading />
          ) : plans.error ? (
            <ErrorBox error={plans.error} />
          ) : weekPlans.length === 0 ? (
            <Empty text="이번 주 계획이 없습니다" />
          ) : (
            <ul className="space-y-3">
              {weekPlans.map((p) => (
                <li key={p.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{p.title}</span>
                    <span className="text-xs text-muted">
                      {p.doneCount}/{p.todoCount}
                    </span>
                  </div>
                  <ProgressBar value={p.progress} label={`${p.title} 진행률`} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`${year}년 목표`} href="/goals">
          {goals.isLoading ? (
            <Loading />
          ) : goals.error ? (
            <ErrorBox error={goals.error} />
          ) : yearGoals.length === 0 ? (
            <Empty text="올해 목표가 없습니다" />
          ) : (
            <ul className="space-y-3">
              {yearGoals.map((g) => (
                <li key={g.id} className="space-y-1">
                  <div className="text-sm">{g.title}</div>
                  <ProgressBar value={g.progress} label={`${g.title} 진행률`} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
