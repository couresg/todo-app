export function calcWeeklyProgress({ done, total }: { done: number; total: number }): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function calcGoalProgress(progresses: number[]): number {
  if (progresses.length === 0) return 0;
  const sum = progresses.reduce((a, b) => a + b, 0);
  return Math.round(sum / progresses.length);
}
