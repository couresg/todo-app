import type { TodoStatus } from "@/types/api";

export const STATUS_LABEL: Record<TodoStatus, string> = {
  todo: "할 일",
  doing: "진행 중",
  done: "완료",
};

const STYLE: Record<TodoStatus, string> = {
  todo: "bg-line text-muted",
  doing: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  done: "bg-accent/20 text-accent",
};

export default function StatusBadge({ status }: { status: TodoStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
