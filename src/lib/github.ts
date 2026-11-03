import snapshotJson from '../data/snapshot.json';
import { FEED_MAX, ORG } from './site';

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  license: string | null;
  topics: string[];
  pushed?: string | null;
};
export type Item = { number: number; title: string; repo: string; url: string; at: string; gfi?: boolean };
export type GH = {
  source: 'live' | 'partial' | 'snapshot';
  stale: string[];
  fetchedAt: string;
  repos: Repo[];
  members: string[];
  contributors: string[];
  mergedPrs: Item[];
  goodFirst: Item[];
  openPrs: number | null;
  openIssues: number | null;
  activity: number[];
};

export const REVALIDATE = 3600; // seconds; the data cache and every page that reads it refresh hourly
const snapshot = snapshotJson as unknown as GH;

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ergane-website',
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const q = encodeURIComponent;
const union = (...lists: string[][]) => {
  const seen = new Map<string, string>();
  lists.flat().forEach((l) => seen.has(l.toLowerCase()) || seen.set(l.toLowerCase(), l));
  return [...seen.values()];
};

// One request. Network blips, 5xx and 202 ("stats still computing") are retried; rate limiting (403/429) fails fast
// because the limit resets in minutes to an hour and retrying only burns more of it.
async function request(url: string): Promise<{ body: any; next?: string }> {
  for (let i = 1; ; i++) {
    const last = i >= 3;
    let r: Response;
    try {
      r = await fetch(url, { headers, signal: AbortSignal.timeout(10_000), next: { revalidate: REVALIDATE } });
    } catch (e) {
      if (last) throw e;
      await sleep(500 * i);
      continue;
    }
    if ((r.status === 202 || r.status >= 500) && !last) { await sleep(800 * i); continue; }
    if (r.status === 202 || r.status === 204) return { body: r.status === 204 ? [] : null };
    if (!r.ok) throw new Error(`${url.replace('https://api.github.com', '')} → ${r.status}${r.status === 403 || r.status === 429 ? ' (rate limited?)' : ''}`);
    return { body: await r.json(), next: /<([^>]+)>;\s*rel="next"/.exec(r.headers.get('link') ?? '')?.[1] };
  }
}
const get = async (path: string) => (await request(`https://api.github.com${path}`)).body;
async function pages(path: string, max = 5): Promise<any[]> {
  const out: any[] = [];
  let url: string | undefined = `https://api.github.com${path}`;
  for (let i = 0; url && i < max; i++) {
    const { body, next }: { body: any; next?: string } = await request(url);
    out.push(...(Array.isArray(body) ? body : body?.items ?? []));
    url = next;
  }
  return out;
}

const isUser = (u: any) => u?.type === 'User'; // drops bots (dependabot, github-actions) and deleted accounts
const slim = (i: any): Item => ({ number: i.number, title: i.title, repo: i.repository_url.split('/').pop(), url: i.html_url, at: i.closed_at || i.updated_at || '' });

// Each section below throws on failure, so "GitHub said there are none" ([]) is never confused with "we couldn't ask".
const membersSection = async () => (await pages(`/orgs/${ORG}/public_members?per_page=100`)).filter(isUser).map((m) => m.login as string);

async function feedsSection(repos: any[]) {
  const search = (query: string, extra: string) => get(`/search/issues?q=${q(`org:${ORG} ${query}`)}${extra}`);
  const [merged, open, good] = await Promise.all([
    search('is:pr is:merged', '&sort=updated&per_page=10'),
    search('is:pr is:open', '&per_page=1'),
    search('is:issue is:open label:"good first issue"', `&sort=updated&per_page=${FEED_MAX}`),
  ]);
  if (!merged || !open || !good) throw new Error('search returned no body');

  // Fewer than 5 good first issues: top up with the newest open issues (flagged gfi:false) so the list is always full.
  let goodFirst: Item[] = good.items.slice(0, FEED_MAX).map((i: any) => ({ ...slim(i), gfi: true }));
  if (goodFirst.length < FEED_MAX) {
    const latest = await search('is:issue is:open', '&sort=created&per_page=10');
    if (!latest) throw new Error('search returned no body');
    const have = new Set(goodFirst.map((i) => i.url));
    const filler: Item[] = latest.items.filter((i: any) => !have.has(i.html_url)).map((i: any) => ({ ...slim(i), at: i.created_at, gfi: false }));
    goodFirst = [...goodFirst, ...filler].slice(0, FEED_MAX);
  }
  return {
    mergedPrs: merged.items.map(slim).sort((a: Item, b: Item) => b.at.localeCompare(a.at)).slice(0, FEED_MAX) as Item[],
    goodFirst,
    openPrs: open.total_count as number,
    openIssues: repos.reduce((n, r) => n + r.open_issues_count, 0) - open.total_count,
  };
}

// Everyone with a commit or a pull request (merged, open or closed) in any repository, most active first.
async function peopleSection(repos: any[]) {
  const weight = new Map<string, number>();
  const add = (login: string, n: number) => weight.set(login, (weight.get(login) ?? 0) + n);
  const [byRepo, prs] = await Promise.all([
    Promise.all(repos.map((r) => pages(`/repos/${ORG}/${r.name}/contributors?per_page=100`, 3))),
    pages(`/search/issues?q=${q(`org:${ORG} is:pr`)}&per_page=100`, 5),
  ]);
  byRepo.flat().forEach((c) => isUser(c) && add(c.login, c.contributions));
  prs.forEach((p) => isUser(p.user) && add(p.user.login, 1));
  return [...weight].sort((a, b) => b[1] - a[1]).map(([login]) => login);
}

async function activitySection(repos: any[]) {
  const stats = await Promise.all(repos.map((r) => get(`/repos/${ORG}/${r.name}/stats/participation`).catch(() => null)));
  const ok = stats.filter((s) => s?.all?.length);
  if (!ok.length) throw new Error('participation stats not ready');
  return Array.from({ length: 52 }, (_, w) => ok.reduce((n, s) => n + (s.all[w] ?? 0), 0));
}

// Live data when the API answers. Any section that fails keeps its value from the committed snapshot instead of going
// blank, and `source`/`stale` say what happened. Next's data cache (REVALIDATE) keeps successful responses, so a
// rate-limited refresh costs at most one hour of snapshot data before the next attempt. Set GITHUB_TOKEN in production.
export async function loadGithub(): Promise<GH> {
  let repos: any[];
  try {
    repos = (await pages(`/orgs/${ORG}/repos?per_page=100&type=public`)).filter((r) => !r.fork && !r.archived);
  } catch (e) {
    console.warn(`[github] ${(e as Error).message}; using the committed snapshot. Set GITHUB_TOKEN for a higher rate limit.`);
    return { ...snapshot, source: 'snapshot', stale: [] };
  }

  const run = async <T>(name: string, fn: () => Promise<T>): Promise<[string, T | undefined]> => {
    try { return [name, await fn()]; } catch (e) { console.warn(`[github] ${name}: ${(e as Error).message}`); return [name, undefined]; }
  };
  const [members, feeds, people, activity] = await Promise.all([
    run('members', membersSection),
    run('feeds', () => feedsSection(repos)),
    run('people', () => peopleSection(repos)),
    run('activity', () => activitySection(repos)),
  ]);
  const stale = [members, feeds, people, activity].filter(([, v]) => v === undefined).map(([n]) => n);

  return {
    ...snapshot,
    source: stale.length ? 'partial' : 'live',
    stale,
    fetchedAt: new Date().toISOString(),
    repos: repos.map((r) => ({
      name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count,
      license: r.license?.spdx_id ?? null, topics: r.topics ?? [], pushed: r.pushed_at,
    })),
    ...(members[1] && { members: members[1] as string[] }),
    ...(feeds[1] as Partial<GH> | undefined),
    ...(activity[1] && { activity: activity[1] as number[] }),
    contributors: union((people[1] as string[] | undefined) ?? [], snapshot.contributors), // only ever grows, so a flaky page can't drop people
  };
}
