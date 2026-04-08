import { NextResponse } from "next/server";
import { getPool, ensureDb } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type DayCountRow = RowDataPacket & { day: string; count: string | number };

export async function GET(): Promise<NextResponse> {
  try {
    await ensureDb();
    // Return daily request counts for the last 30 days
    const [rows] = await getPool().execute<DayCountRow[]>(`
      SELECT
        DATE(FROM_UNIXTIME(timestamp / 1000)) AS day,
        COUNT(*) AS count
      FROM requests
      WHERE timestamp >= UNIX_TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 30 DAY)) * 1000
      GROUP BY day
      ORDER BY day ASC
    `);

    const data = rows.map((r) => ({
      day: r.day,
      count: Number(r.count),
    }));

    return NextResponse.json({ code: 200, data });
  } catch (err) {
    console.error("[dash/requests] db error:", err);
    return NextResponse.json({ code: 500, message: "Database error" }, { status: 500 });
  }
}
