export const GITHUB_RELEASES_API =
  "https://api.github.com/repos/9xhk-1/163MusicPro/releases?per_page=1";

export const GITHUB_API_CACHE_TTL = 60;

export const GITHUB_FETCH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "163MusicProServer",
} as const;
