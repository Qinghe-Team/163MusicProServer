import { NextResponse } from "next/server";
import { GITHUB_FETCH_HEADERS, fetchLatestRelease, checkRateLimit } from "@/lib/github";

export async function GET(): Promise<NextResponse> {
  if (!checkRateLimit()) {
    return NextResponse.json(
      { code: 429, message: "Too many requests, please try again later" },
      { status: 429 }
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
      headers: { "User-Agent": GITHUB_FETCH_HEADERS["User-Agent"] },
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
