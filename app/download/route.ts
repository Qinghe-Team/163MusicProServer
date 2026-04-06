import { NextResponse } from "next/server";
import {
  GITHUB_FETCH_HEADERS,
  fetchLatestRelease,
  checkRateLimit,
  getApkCache,
  setApkCache,
} from "@/lib/github";

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
  const versionCode = latest.tag_name;

  // Return cached APK if the version matches
  const cached = getApkCache();
  if (cached && cached.versionCode === versionCode) {
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${cached.name}"`);
    headers.set("Content-Type", cached.contentType);
    headers.set("Content-Length", String(cached.data.byteLength));
    return new NextResponse(cached.data, { status: 200, headers });
  }

  // Fetch from GitHub and populate the cache
  let fileRes: Response;
  try {
    fileRes = await fetch(asset.browser_download_url, {
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

  const contentType =
    fileRes.headers.get("Content-Type") ?? "application/octet-stream";

  const data = await fileRes.arrayBuffer();

  setApkCache({ versionCode, data, name: asset.name, contentType });

  const headers = new Headers();
  headers.set("Content-Disposition", `attachment; filename="${asset.name}"`);
  headers.set("Content-Type", contentType);
  headers.set("Content-Length", String(data.byteLength));

  return new NextResponse(data, { status: 200, headers });
}
