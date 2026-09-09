import { useEffect, useState } from "react";

/**
 * Live GitHub metadata for the featured repos, fetched client-side from the
 * public REST API (no auth needed). Results are cached in sessionStorage for
 * an hour so scrolling back / re-mounts never re-hit the rate limit.
 * If the API is unreachable or rate-limited, `stats` stays null and the UI
 * silently falls back to static content.
 */

export type RepoStats = {
  stars: number;
  forks: number;
  language: string | null;
  pushedAt: string; // ISO date of last push
  url: string;
};

type CacheShape = Record<string, RepoStats>;

const CACHE_KEY = "gh-repo-stats-v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readCache(): { data: CacheShape; ts: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: CacheShape; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CacheShape) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

/**
 * Parse a GitHub URL or "owner/repo" slug into a normalized string
 * like "CodeNexus404/SocialFlow". Returns undefined if the input is empty.
 */
export function parseRepoSlug(input?: string): string | undefined {
  if (!input) return undefined;
  // Handle full URLs: https://github.com/CodeNexus404/SocialFlow
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;
  // Handle plain slugs: CodeNexus404/SocialFlow
  const parts = input.split("/");
  if (parts.length >= 2)
    return `${parts[0]}/${parts[1].replace(/\.git$/, "")}`;
  return undefined;
}

/** Relative-time helper ("2 hours ago", "3 days ago", etc.) */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Fetch live stats for GitHub repos by slug string (e.g. "CodeNexus404/SocialFlow").
 * Returns `{ stats }` where `stats` is a `Record<string, RepoStats>`.
 */
function useGithubRepos(
  slugs: string[],
): { stats: Record<string, RepoStats> } {
  const [stats, setStats] = useState<Record<string, RepoStats>>(() => {
    const cached = readCache();
    if (!cached) return {};
    const result: Record<string, RepoStats> = {};
    for (const key of slugs) {
      if (cached.data[key]) result[key] = cached.data[key];
    }
    return result;
  });

  useEffect(() => {
    if (slugs.length === 0) return;

    const cached = readCache();
    const toFetch = slugs.filter((s) => !cached?.data[s]);
    if (toFetch.length === 0) return;

    let cancelled = false;

    async function fetchRepos() {
      const results: CacheShape = {};

      await Promise.allSettled(
        toFetch.map(async (slugStr) => {
          const [owner, repo] = slugStr.split("/");
          if (!owner || !repo) return;
          try {
            const res = await fetch(
              `https://api.github.com/repos/${owner}/${repo}`,
            );
            if (!res.ok) return;
            const data = await res.json();
            results[slugStr] = {
              stars: data.stargazers_count ?? 0,
              forks: data.forks_count ?? 0,
              language: data.language ?? null,
              pushedAt: data.pushed_at ?? new Date().toISOString(),
              url: data.html_url ?? `https://github.com/${owner}/${repo}`,
            };
          } catch {
            // network error — silently skip
          }
        }),
      );

      if (cancelled) return;

      setStats((prev) => ({ ...prev, ...results }));

      const merged = { ...cached?.data, ...results };
      writeCache(merged);
    }

    fetchRepos();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(",")]);

  return { stats };
}

export { useGithubRepos };
