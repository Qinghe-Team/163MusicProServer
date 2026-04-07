import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, GITHUB_FETCH_HEADERS } from "@/lib/github";

const SOURCE_JSON_URL =
  "https://raw.githubusercontent.com/9xhk-1/163MusicPro/main/source.json";

const EXTRA_SOURCE = "https://163.imoow.com/download";

const SOURCE_CACHE_TTL = 60 * 1000;

type SourceCache = {
  data: string[];
  expiresAt: number;
} | null;

let sourceCache: SourceCache = null;

async function fetchSourceList(): Promise<
  { ok: true; data: string[] } | { ok: false; status: number; message: string }
> {
  const now = Date.now();
  if (sourceCache && now < sourceCache.expiresAt) {
    return { ok: true, data: sourceCache.data };
  }

  let res: Response;
  try {
    res = await fetch(SOURCE_JSON_URL, {
      headers: { "User-Agent": GITHUB_FETCH_HEADERS["User-Agent"] },
    });
  } catch (err) {
    console.error("[source] fetch error:", err);
    return { ok: false, status: 502, message: "Failed to fetch source.json from GitHub" };
  }

  if (!res.ok) {
    return { ok: false, status: 502, message: "GitHub returned an error for source.json" };
  }

  let list: unknown;
  try {
    list = await res.json();
  } catch {
    return { ok: false, status: 502, message: "source.json is not valid JSON" };
  }

  if (!Array.isArray(list)) {
    return { ok: false, status: 502, message: "source.json is not an array" };
  }

  const data = list as string[];
  sourceCache = { data, expiresAt: now + SOURCE_CACHE_TTL };
  return { ok: true, data };
}

export async function GET(): Promise<NextResponse> {
  if (!checkRateLimit()) {
    return NextResponse.json(
      { code: 429, message: "Too many requests, please try again later" },
      { status: 429 }
    );
  }

  const result = await fetchSourceList();
  if (!result.ok) {
    return NextResponse.json(
      { code: result.status, message: result.message },
      { status: result.status }
    );
  }

  const data = [...result.data];
  const alreadyPresent = data.some((item) => item === EXTRA_SOURCE);
  if (!alreadyPresent) {
    data.push(EXTRA_SOURCE);
  }

  return NextResponse.json({ code: 200, data });
}
