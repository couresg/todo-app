import { todoUpdateSchema } from "@/lib/validation";
import { handle, noContent, parseBody, parseId } from "@/server/http";
import { deleteTodo, getTodo, updateTodo } from "@/server/services/todos";

type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) =>
  handle(async () => Response.json(await getTodo(parseId((await params).id))));

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const id = parseId((await params).id);
    return Response.json(await updateTodo(id, await parseBody(req, todoUpdateSchema)));
  });

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    await deleteTodo(parseId((await params).id));
    return noContent();
  });
