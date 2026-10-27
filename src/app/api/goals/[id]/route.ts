import { goalUpdateSchema } from "@/lib/validation";
import { handle, noContent, parseBody, parseId } from "@/server/http";
import { deleteGoal, getGoal, updateGoal } from "@/server/services/goals";

type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) =>
  handle(async () => Response.json(await getGoal(parseId((await params).id))));

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const id = parseId((await params).id);
    return Response.json(await updateGoal(id, await parseBody(req, goalUpdateSchema)));
  });

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    await deleteGoal(parseId((await params).id));
    return noContent();
  });
