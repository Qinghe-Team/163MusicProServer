import { NextRequest, NextResponse } from "next/server";
import { fetchLatestRelease, checkRateLimit } from "@/lib/github";
import { logRequest } from "@/lib/request-logger";

function extractBuildNumber(tagName: string): number | null {
  const match = tagName.match(/build(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

function extractVersionName(releaseName: string | null, tagName: string): string {
  const rawName = releaseName?.trim() ? releaseName : tagName;
  return rawName.replace(/-build[^-\s]*$/i, "");
}

async function handleCheckUpdate(req: NextRequest): Promise<NextResponse> {
  logRequest(req);
  if (!checkRateLimit()) {
    return NextResponse.json(
      { code: 429, message: "Too many requests, please try again later" },
      { status: 429 }
    );
  }

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

  const result = await fetchLatestRelease();
  if (!result.ok) {
    return NextResponse.json(
      { code: result.status, message: result.message },
      { status: result.status }
    );
  }

  const releases = result.data;
  if (!releases || releases.length === 0) {
    return NextResponse.json(
      { code: 502, message: "No releases found" },
      { status: 502 }
    );
  }

  const latest = releases[0];
  const latestBuild = extractBuildNumber(latest.tag_name);
  const versionName = extractVersionName(latest.name, latest.tag_name);

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
        versionName,
        is_latest: false,
      },
    });
  }

  return NextResponse.json({
    code: 200,
    data: {
      download_url: null,
      version: latestBuild,
      versionName,
      is_latest: true,
    },
  });
}

export const POST = handleCheckUpdate;
