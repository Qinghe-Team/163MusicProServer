import { type NextRequest } from "next/server";
import { getPool, ensureDb } from "@/lib/db";

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function logRequest(req: NextRequest): void {
  const method = req.method;
  const path = req.nextUrl.pathname;
  const timestamp = Date.now();
  const ip = getClientIp(req);

  // Non-blocking: fire and forget
  (async () => {
    try {
      await ensureDb();
      await getPool().execute(
        "INSERT INTO requests (method, path, timestamp, ip) VALUES (?, ?, ?, ?)",
        [method, path, timestamp, ip]
      );
    } catch {
      // Logging errors must never affect the main request flow
    }
  })();
}
