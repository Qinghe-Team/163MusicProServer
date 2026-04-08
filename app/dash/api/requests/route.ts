import { NextResponse } from "next/server";
import { getPool, ensureDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type StatsRow = RowDataPacket & { total: string | number; today: string | number };

export async function GET(): Promise<NextResponse> {
  try {
    await ensureDb();
    const [[row]] = await getPool().execute<StatsRow[]>(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(FROM_UNIXTIME(timestamp / 1000)) = CURDATE() THEN 1 ELSE 0 END) AS today
      FROM requests
    `);

    return NextResponse.json({
      code: 200,
      data: { total: Number(row.total), today: Number(row.today) },
    });
  } catch (err) {
    console.error("[dash/requests] db error:", err);
    return NextResponse.json({ code: 500, message: "Database error" }, { status: 500 });
  }
}
