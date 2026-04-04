import { NextRequest, NextResponse } from "next/server";
import { GITHUB_RELEASES_API, GITHUB_FETCH_HEADERS } from "@/lib/github";

function extractBuildNumber(tagName: string): number | null {
  const match = tagName.match(/build(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

async function handleCheckUpdate(req: NextRequest): Promise<NextResponse> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { code: 400, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  let clientVersion: number;
  try {
    const raw = body.version;
    if (typeof raw === "number" && Number.isInteger(raw)) {
      clientVersion = raw;
    } else {
      clientVersion = parseInt(String(raw), 10);
      if (isNaN(clientVersion)) {
        return NextResponse.json(
          { code: 400, message: "version must be an integer" },
          { status: 400 }
        );
      }
    }
  } catch {
    return NextResponse.json(
      { code: 400, message: "version must be an integer" },
      { status: 400 }
    );
  }

  let ghRes: Response;
  try {
    ghRes = await fetch(GITHUB_RELEASES_API, {
      headers: GITHUB_FETCH_HEADERS,
      next: { revalidate: 60 },
    });
  } catch {
    return NextResponse.json(
      { code: 502, message: "Failed to connect to GitHub API" },
      { status: 502 }
    );
  }

  if (!ghRes.ok) {
    return NextResponse.json(
      { code: 502, message: "Failed to fetch releases from GitHub" },
      { status: 502 }
    );
  }

  const releases: Array<{
    tag_name: string;
    assets: Array<{ browser_download_url: string }>;
  }> = await ghRes.json();

  if (!releases || releases.length === 0) {
    return NextResponse.json(
      { code: 502, message: "No releases found" },
      { status: 502 }
    );
  }

  const latest = releases[0];
  const latestBuild = extractBuildNumber(latest.tag_name);

  if (latestBuild === null) {
    return NextResponse.json(
      { code: 502, message: "Could not parse build number from latest release" },
      { status: 502 }
    );
  }

  const downloadUrl =
    latest.assets.length > 0
      ? latest.assets[0].browser_download_url
      : null;

  if (clientVersion < latestBuild) {
    return NextResponse.json({
      code: 200,
      data: {
        download_url: downloadUrl,
        version: latestBuild,
        is_latest: false,
      },
    });
  }

  return NextResponse.json({
    code: 200,
    data: {
      download_url: null,
      version: latestBuild,
      is_latest: true,
    },
  });
}

export const POST = handleCheckUpdate;
