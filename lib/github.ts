export const GITHUB_RELEASES_API =
  "https://api.github.com/repos/9xhk-1/163MusicPro/releases?per_page=1";

export const GITHUB_API_CACHE_TTL = 60;

export const GITHUB_FETCH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "163MusicProServer",
} as const;

// ---------------------------------------------------------------------------
// GitHub token – read from Vercel env at request time
// ---------------------------------------------------------------------------
function buildFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = { ...GITHUB_FETCH_HEADERS };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// In-memory release cache (1 minute TTL)
// ---------------------------------------------------------------------------
export type ReleaseAsset = {
  browser_download_url: string;
  name: string;
  size: number;
};

export type Release = {
  tag_name: string;
  assets: ReleaseAsset[];
};

type ReleaseCache = {
  data: Release[];
  expiresAt: number;
} | null;

let releaseCache: ReleaseCache = null;

export async function fetchLatestRelease(): Promise<
  { ok: true; data: Release[] } | { ok: false; status: number; message: string }
> {
  const now = Date.now();
  if (releaseCache && now < releaseCache.expiresAt) {
    return { ok: true, data: releaseCache.data };
  }

  let ghRes: Response;
  try {
    ghRes = await fetch(GITHUB_RELEASES_API, { headers: buildFetchHeaders() });
  } catch (err) {
    console.error("[github] fetch error:", err);
    return { ok: false, status: 502, message: "Failed to connect to GitHub API" };
  }

  if (!ghRes.ok) {
    return { ok: false, status: 502, message: "Failed to fetch releases from GitHub" };
  }

  const releases: Release[] = await ghRes.json();
  releaseCache = { data: releases, expiresAt: now + GITHUB_API_CACHE_TTL * 1000 };
  return { ok: true, data: releases };
}

// ---------------------------------------------------------------------------
// In-memory rate limiter – 10 requests per minute across all endpoints
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

let rateLimitCount = 0;
let rateLimitWindowStart = 0;

export function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - rateLimitWindowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitWindowStart = now;
    rateLimitCount = 0;
  }
  if (rateLimitCount >= RATE_LIMIT_MAX) {
    return false;
  }
  rateLimitCount += 1;
  return true;
}
