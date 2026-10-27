import { connection, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connection();
  try {
    await connectDB();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const error = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
