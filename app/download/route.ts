import { NextResponse } from "next/server";
import { GITHUB_RELEASES_API, GITHUB_FETCH_HEADERS } from "@/lib/github";

export async function GET(): Promise<NextResponse> {
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
    assets: Array<{ browser_download_url: string; name: string; size: number }>;
  }> = await ghRes.json();

  if (!releases || releases.length === 0) {
    return NextResponse.json(
      { code: 502, message: "No releases found" },
      { status: 502 }
    );
  }

  const latest = releases[0];

  if (latest.assets.length === 0) {
    return NextResponse.json(
      { code: 502, message: "No assets found in latest release" },
      { status: 502 }
    );
  }

  const asset = latest.assets[0];
  const downloadUrl = asset.browser_download_url;

  // Proxy the download by streaming the asset from GitHub
  let fileRes: Response;
  try {
    fileRes = await fetch(downloadUrl, {
      headers: { "User-Agent": "163MusicProServer" },
    });
  } catch {
    return NextResponse.json(
      { code: 502, message: "Failed to fetch download from GitHub" },
      { status: 502 }
    );
  }

  if (!fileRes.ok) {
    return NextResponse.json(
      { code: 502, message: "GitHub returned an error for the download" },
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Disposition",
    `attachment; filename="${asset.name}"`
  );
  headers.set(
    "Content-Type",
    fileRes.headers.get("Content-Type") ?? "application/octet-stream"
  );
  const contentLength = fileRes.headers.get("Content-Length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(fileRes.body, { status: 200, headers });
}
