"use client";

import { Empty, ErrorBox, Loading } from "@/components/State";
import StatusBadge from "@/components/StatusBadge";
import WeeklyPlanSelect from "@/components/WeeklyPlanSelect";
import { useTodos, useUpdateTodo } from "@/hooks/useTodos";

export default function UnlinkedPage() {
  const { data, isLoading, error } = useTodos({ unlinked: true });
  const update = useUpdateTodo();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">미연결 할 일</h1>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((t) => (
            <li key={t.id} className="card flex flex-wrap items-center gap-3 p-3" data-testid="unlinked-item">
              <StatusBadge status={t.status} />
              <span className="min-w-0 flex-1 break-words">{t.title}</span>
              <span className="text-xs tabular-nums text-muted">{t.date}</span>
              <WeeklyPlanSelect
                label="주간 계획 연결"
                value=""
                noneLabel="주간 계획 연결"
                disabled={update.isPending && update.variables?.id === t.id}
                onChange={(planId) => planId && update.mutate({ id: t.id, weeklyPlanId: planId })}
              />
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="미연결 할 일이 없습니다" />
      )}
    </div>
  );
}
