import { connection } from "next/server";
import mongoose from "mongoose";
import type { z } from "zod";
import { connectDB } from "@/lib/db";
import { objectIdSchema } from "@/lib/validation";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function errorResponse(status: number, error: string, details?: unknown): Response {
  return Response.json(details === undefined ? { error } : { error, details }, { status });
}

export function parseId(id: string): string {
  if (!objectIdSchema.safeParse(id).success) throw new HttpError(400, "Invalid id");
  return id;
}

export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

export function parseWith<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, "Validation failed", r.error.issues);
  return r.data;
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return parseWith(schema, json);
}

/** Per-request setup (connection(), connectDB) plus uniform error mapping. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  await connection();
  try {
    await connectDB();
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return errorResponse(e.status, e.message, e.details);
    console.error(e);
    return errorResponse(500, "Internal server error");
  }
}

export const noContent = () => new Response(null, { status: 204 });
