import { todoReorderSchema } from "@/lib/validation";
import { handle, parseBody } from "@/server/http";
import { reorderTodos } from "@/server/services/todos";

export const PATCH = (req: Request) =>
  handle(async () => {
    const { status, orderedIds, movedId } = await parseBody(req, todoReorderSchema);
    await reorderTodos(status, orderedIds, movedId);
    return Response.json({ ok: true });
  });
