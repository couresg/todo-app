"use client";

import { useState } from "react";
import { Empty, ErrorBox, Loading } from "@/components/State";
import TodoForm from "@/components/TodoForm";
import TodoRow from "@/components/TodoRow";
import { useTodos } from "@/hooks/useTodos";
import { todayString } from "@/lib/week";

export default function TodosPage() {
  const [today] = useState(todayString);
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? today;
  const { data, isLoading, error } = useTodos({ date });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">할 일</h1>
        <input
          type="date"
          className="input"
          aria-label="조회 날짜"
          value={date}
          onChange={(e) => e.target.value && setPicked(e.target.value)}
        />
        <button className="btn" onClick={() => setPicked(null)}>
          오늘
        </button>
      </div>
      <TodoForm defaultDate={date} />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorBox error={error} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((t) => (
            <TodoRow key={t.id} todo={t} />
          ))}
        </ul>
      ) : (
        <Empty />
      )}
    </div>
  );
}
