import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { clearTestDb, startTestDb, stopTestDb } from "@/test/mongo";
import * as goals from "@/app/api/goals/route";
import * as todos from "@/app/api/todos/route";
import * as todoById from "@/app/api/todos/[id]/route";
import * as reorder from "@/app/api/todos/reorder/route";

// connection() only works inside a Next request scope
vi.mock("next/server", () => ({ connection: async () => {} }));

beforeAll(async () => {
  process.env.MONGODB_URI ??= "mongodb://unused/";
  await startTestDb();
});
afterAll(stopTestDb);
beforeEach(clearTestDb);

const json = (method: string, body?: unknown) =>
  new Request("http://x/api", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const missing = () => new mongoose.Types.ObjectId().toString();

describe("route handlers", () => {
  it("POST 201 with DTO, GET list 200 bare array", async () => {
    const res = await goals.POST(json("POST", { title: "g", year: 2026 }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ title: "g", year: 2026, progress: 0 });
    const list = await goals.GET();
    expect(list.status).toBe(200);
    expect(await list.json()).toHaveLength(1);
  });

  it("400 on invalid body and malformed JSON", async () => {
    const bad = await todos.POST(json("POST", { title: "", date: "nope" }));
    expect(bad.status).toBe(400);
    const body = await bad.json();
    expect(body.error).toBeTruthy();
    expect(Array.isArray(body.details)).toBe(true);
    expect((await todos.POST(json("POST", "{not json"))).status).toBe(400);
  });

  it("400 on bad ObjectId in path, 404 on missing", async () => {
    expect((await todoById.PATCH(json("PATCH", { title: "x" }), ctx("zzz"))).status).toBe(400);
    expect((await todoById.DELETE(json("DELETE"), ctx(missing()))).status).toBe(404);
    expect((await todoById.GET(json("GET"), ctx(missing()))).status).toBe(404);
  });

  it("400 on unknown weeklyPlanId", async () => {
    const res = await todos.POST(json("POST", { title: "a", date: "2026-10-27", weeklyPlanId: missing() }));
    expect(res.status).toBe(400);
  });

  it("PATCH 200, DELETE 204 with empty body", async () => {
    const created = await (await todos.POST(json("POST", { title: "a", date: "2026-10-27" }))).json();
    expect(created.status).toBe("todo");
    const patched = await todoById.PATCH(json("PATCH", { status: "done" }), ctx(created.id));
    expect(patched.status).toBe(200);
    expect((await patched.json()).status).toBe("done");
    const del = await todoById.DELETE(json("DELETE"), ctx(created.id));
    expect(del.status).toBe(204);
    expect(await del.text()).toBe("");
  });

  it("reorder 200 {ok:true}; unknown id 400", async () => {
    const a = await (await todos.POST(json("POST", { title: "a", date: "2026-10-27" }))).json();
    const ok = await reorder.PATCH(json("PATCH", { status: "doing", orderedIds: [a.id] }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    const bad = await reorder.PATCH(json("PATCH", { status: "doing", orderedIds: [missing()] }));
    expect(bad.status).toBe(400);
    const dup = await reorder.PATCH(json("PATCH", { status: "doing", orderedIds: [a.id, a.id] }));
    expect(dup.status).toBe(400);
  });
});
