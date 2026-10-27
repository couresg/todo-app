import { dateStringSchema, objectIdSchema, todoCreateSchema } from "@/lib/validation";
import { handle, parseBody, parseWith } from "@/server/http";
import { createTodo, listTodos } from "@/server/services/todos";

export const GET = (req: Request) =>
  handle(async () => {
    const q = new URL(req.url).searchParams;
    const date = q.get("date");
    const weeklyPlanId = q.get("weeklyPlanId");
    return Response.json(
      await listTodos({
        date: date ? parseWith(dateStringSchema, date) : undefined,
        weeklyPlanId: weeklyPlanId ? parseWith(objectIdSchema, weeklyPlanId) : undefined,
        unlinked: q.get("unlinked") === "true",
      }),
    );
  });

export const POST = (req: Request) =>
  handle(async () => {
    const body = await parseBody(req, todoCreateSchema);
    return Response.json(await createTodo(body), { status: 201 });
  });
