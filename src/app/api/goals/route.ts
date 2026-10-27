import { goalCreateSchema } from "@/lib/validation";
import { handle, parseBody } from "@/server/http";
import { createGoal, listGoals } from "@/server/services/goals";

export const GET = () => handle(async () => Response.json(await listGoals()));

export const POST = (req: Request) =>
  handle(async () => {
    const body = await parseBody(req, goalCreateSchema);
    return Response.json(await createGoal(body), { status: 201 });
  });
