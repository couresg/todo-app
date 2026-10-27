export function Loading() {
  return <p className="py-8 text-center text-sm text-muted">불러오는 중...</p>;
}

export function Empty({ text = "할 일이 없습니다" }: { text?: string }) {
  return <p className="py-8 text-center text-sm text-muted">{text}</p>;
}

export function ErrorBox({ error }: { error: unknown }) {
  const msg = error instanceof Error ? error.message : "오류가 발생했습니다";
  return <p className="py-4 text-center text-sm text-danger">{msg}</p>;
}
