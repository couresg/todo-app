import { objectIdSchema, weeklyPlanCreateSchema } from "@/lib/validation";
import { handle, parseBody, parseWith } from "@/server/http";
import { createWeeklyPlan, listWeeklyPlans } from "@/server/services/weeklyPlans";

export const GET = (req: Request) =>
  handle(async () => {
    const raw = new URL(req.url).searchParams.get("goalId");
    const goalId = raw ? parseWith(objectIdSchema, raw) : undefined;
    return Response.json(await listWeeklyPlans(goalId));
  });

export const POST = (req: Request) =>
  handle(async () => {
    const body = await parseBody(req, weeklyPlanCreateSchema);
    return Response.json(await createWeeklyPlan(body), { status: 201 });
  });
