const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function parse(s: string): number {
  const m = DATE_RE.exec(s);
  if (!m) throw new Error(`Invalid date string: ${s}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function format(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isValidDateString(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  return format(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) === s;
}

export function addDays(dateStr: string, n: number): string {
  return format(parse(dateStr) + n * DAY_MS);
}

/** Monday of the week containing dateStr. */
export function toWeekStart(dateStr: string): string {
  const dow = new Date(parse(dateStr)).getUTCDay(); // 0 = Sunday
  return addDays(dateStr, -((dow + 6) % 7));
}

export function weekEndOf(weekStart: string): string {
  return addDays(weekStart, 6);
}

/** Today in the local timezone as YYYY-MM-DD. */
export function todayString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
