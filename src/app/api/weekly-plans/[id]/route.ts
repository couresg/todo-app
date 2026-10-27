import { weeklyPlanUpdateSchema } from "@/lib/validation";
import { handle, noContent, parseBody, parseId } from "@/server/http";
import {
  deleteWeeklyPlan,
  getWeeklyPlan,
  updateWeeklyPlan,
} from "@/server/services/weeklyPlans";

type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) =>
  handle(async () => Response.json(await getWeeklyPlan(parseId((await params).id))));

export const PATCH = (req: Request, { params }: Ctx) =>
  handle(async () => {
    const id = parseId((await params).id);
    return Response.json(await updateWeeklyPlan(id, await parseBody(req, weeklyPlanUpdateSchema)));
  });

export const DELETE = (_req: Request, { params }: Ctx) =>
  handle(async () => {
    await deleteWeeklyPlan(parseId((await params).id));
    return noContent();
  });
