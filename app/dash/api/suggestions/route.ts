import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type SuggestionRow = RowDataPacket & { id: number; content: string; created_at: number };
type CountRow = RowDataPacket & { total: string | number };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const pageNum = Math.max(0, parseInt(searchParams.get("pageNum") ?? "0", 10) || 0);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10));
  const offset = pageNum * pageSize;

  try {
    await ensureDb();
    const [rows] = await getPool().execute<SuggestionRow[]>(
      "SELECT id, content, created_at FROM suggestions ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [pageSize, offset]
    );
    const [[countRow]] = await getPool().execute<CountRow[]>(
      "SELECT COUNT(*) AS total FROM suggestions"
    );
    const total = Number(countRow.total);

    return NextResponse.json({
      code: 200,
      data: {
        list: rows,
        total,
        pageNum,
        pageSize,
      },
    });
  } catch (err) {
    console.error("[dash/suggestions] db error:", err);
    return NextResponse.json({ code: 500, message: "Database error" }, { status: 500 });
  }
}
