import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureDb } from "@/lib/db";
import { logRequest } from "@/lib/request-logger";

export async function POST(req: NextRequest): Promise<NextResponse> {
  logRequest(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: 400, message: "Invalid JSON body" }, { status: 400 });
  }

  const content = body.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { code: 400, message: "content is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    await ensureDb();
    await getPool().execute(
      "INSERT INTO suggestions (content, created_at) VALUES (?, ?)",
      [content.trim(), Date.now()]
    );
  } catch (err) {
    console.error("[suggest] db error:", err);
    return NextResponse.json({ code: 500, message: "Failed to save suggestion" }, { status: 500 });
  }

  return NextResponse.json({ code: 200, message: "Suggestion submitted" });
}
