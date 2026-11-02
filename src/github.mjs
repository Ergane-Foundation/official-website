import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { ORG } from './site.mjs';

const CACHE = '.cache/github.json';
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ergane-website-build',
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

async function get(path) {
  const r = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
}
const q = (s) => encodeURIComponent(s);
const optional = (p) => p.catch(() => null);

async function live() {
  const repos = (await get(`/orgs/${ORG}/repos?per_page=100&type=public`)).filter((r) => !r.fork && !r.archived);
  const [prs, openPrs, good] = await Promise.all([
    optional(get(`/search/issues?q=${q(`org:${ORG} is:pr is:merged`)}&sort=updated&per_page=6`)),
    optional(get(`/search/issues?q=${q(`org:${ORG} is:pr is:open`)}&per_page=1`)),
    optional(get(`/search/issues?q=${q(`org:${ORG} is:issue is:open label:"good first issue"`)}&sort=updated&per_page=8`)),
  ]);
  const extra = await Promise.all(repos.map(async (r) => ({
    contributors: await optional(get(`/repos/${ORG}/${r.name}/contributors?per_page=30`)),
    participation: await optional(get(`/repos/${ORG}/${r.name}/stats/participation`)), // 202 while GitHub computes it → empty
  })));

  const slim = (i) => ({ number: i.number, title: i.title, repo: i.repository_url.split('/').pop(), url: i.html_url, at: i.closed_at || i.updated_at });
  const weeks = Array.from({ length: 52 }, (_, w) => extra.reduce((n, e) => n + (e.participation?.all?.[w] ?? 0), 0));
  const people = new Map();
  extra.forEach((e) => (Array.isArray(e.contributors) ? e.contributors : []).forEach((c) => c.type === 'User' && people.set(c.login, (people.get(c.login) ?? 0) + c.contributions)));
  const totalOpen = repos.reduce((n, r) => n + r.open_issues_count, 0);

  return {
    source: 'live',
    fetchedAt: new Date().toISOString(),
    repos: repos.map((r) => ({
      name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count,
      license: r.license?.spdx_id ?? null, topics: r.topics ?? [], pushed: r.pushed_at,
    })),
    openPrs: openPrs?.total_count ?? null,
    openIssues: openPrs ? totalOpen - openPrs.total_count : totalOpen,
    mergedPrs: (prs?.items ?? []).map(slim),
    goodFirst: (good?.items ?? []).map(slim),
    contributors: [...people].sort((a, b) => b[1] - a[1]).map(([login]) => login),
    activity: weeks.some(Boolean) ? weeks : [],
  };
}

// Live data when the API answers, otherwise the committed snapshot. A fresh cache (<15 min) avoids hammering the
// unauthenticated 60 req/h limit while iterating locally.
export async function loadGithub() {
  try {
    if (Date.now() - (await stat(CACHE)).mtimeMs < 15 * 60_000) return JSON.parse(await readFile(CACHE, 'utf8'));
  } catch {}
  try {
    const data = await live();
    await mkdir('.cache', { recursive: true });
    await writeFile(CACHE, JSON.stringify(data));
    return data;
  } catch (e) {
    console.warn(`[github] live fetch failed (${e.message}); using committed snapshot. Set GITHUB_TOKEN for a higher rate limit.`);
    return JSON.parse(await readFile(new URL('./snapshot.json', import.meta.url), 'utf8'));
  }
}
