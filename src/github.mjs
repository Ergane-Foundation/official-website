import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ORG, FEED_MAX } from './site.mjs';

const SNAPSHOT = new URL('./snapshot.json', import.meta.url);
const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ergane-website-build',
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = encodeURIComponent;
const readJson = (p) => readFile(p, 'utf8').then(JSON.parse, () => null);
const union = (...lists) => {
  const seen = new Map();
  lists.flat().forEach((l) => seen.has(l.toLowerCase()) || seen.set(l.toLowerCase(), l));
  return [...seen.values()];
};

// One request. Network blips, 5xx and 202 ("stats still computing") are retried; rate limiting (403/429) fails fast
// because the limit resets in minutes to an hour and retrying only burns more of it.
async function request(url) {
  for (let i = 1; ; i++) {
    const last = i >= 3;
    let r;
    try { r = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) }); }
    catch (e) { if (last) throw e; await sleep(500 * i); continue; }
    if ((r.status === 202 || r.status >= 500) && !last) { await sleep(800 * i); continue; }
    if (r.status === 202 || r.status === 204) return { body: r.status === 204 ? [] : null };
    if (!r.ok) throw new Error(`${url.replace('https://api.github.com', '')} → ${r.status}${r.status === 403 || r.status === 429 ? ' (rate limited?)' : ''}`);
    return { body: await r.json(), next: /<([^>]+)>;\s*rel="next"/.exec(r.headers.get('link') ?? '')?.[1] };
  }
}
const get = async (path) => (await request(`https://api.github.com${path}`)).body;
async function pages(path, max = 5) {
  const out = [];
  let url = `https://api.github.com${path}`;
  for (let i = 0; url && i < max; i++) {
    const { body, next } = await request(url);
    out.push(...(Array.isArray(body) ? body : body?.items ?? []));
    url = next;
  }
  return out;
}

const isUser = (u) => u?.type === 'User'; // drops bots (dependabot, github-actions) and deleted accounts
const slim = (i) => ({ number: i.number, title: i.title, repo: i.repository_url.split('/').pop(), url: i.html_url, at: i.closed_at || i.updated_at || '' });

// Each section below throws on failure, so "GitHub said there are none" ([]) is never confused with "we couldn't ask".
const membersSection = async () => (await pages(`/orgs/${ORG}/public_members?per_page=100`)).filter(isUser).map((m) => m.login);

async function feedsSection(repos) {
  const search = (query, extra) => get(`/search/issues?q=${q(`org:${ORG} ${query}`)}${extra}`);
  const [merged, open, good] = await Promise.all([
    search('is:pr is:merged', '&sort=updated&per_page=10'),
    search('is:pr is:open', '&per_page=1'),
    search('is:issue is:open label:"good first issue"', `&sort=updated&per_page=${FEED_MAX}`),
  ]);
  if (!merged || !open || !good) throw new Error('search returned no body');

  // Fewer than 5 good first issues: top up with the newest open issues (flagged gfi:false) so the list is always full.
  let goodFirst = good.items.slice(0, FEED_MAX).map((i) => ({ ...slim(i), gfi: true }));
  if (goodFirst.length < FEED_MAX) {
    const latest = await search('is:issue is:open', '&sort=created&per_page=10');
    if (!latest) throw new Error('search returned no body');
    const have = new Set(goodFirst.map((i) => i.url));
    const filler = latest.items.filter((i) => !have.has(i.html_url)).map((i) => ({ ...slim(i), at: i.created_at, gfi: false }));
    goodFirst = [...goodFirst, ...filler].slice(0, FEED_MAX);
  }
  return {
    mergedPrs: merged.items.map(slim).sort((a, b) => b.at.localeCompare(a.at)).slice(0, FEED_MAX),
    goodFirst,
    openPrs: open.total_count,
    openIssues: repos.reduce((n, r) => n + r.open_issues_count, 0) - open.total_count,
  };
}

// Everyone with a commit or a pull request (merged, open or closed) in any repository, most active first.
async function peopleSection(repos) {
  const weight = new Map();
  const add = (login, n) => weight.set(login, (weight.get(login) ?? 0) + n);
  const [byRepo, prs] = await Promise.all([
    Promise.all(repos.map((r) => pages(`/repos/${ORG}/${r.name}/contributors?per_page=100`, 3))),
    pages(`/search/issues?q=${q(`org:${ORG} is:pr`)}&per_page=100`, 5),
  ]);
  byRepo.flat().forEach((c) => isUser(c) && add(c.login, c.contributions));
  prs.forEach((p) => isUser(p.user) && add(p.user.login, 1));
  return [...weight].sort((a, b) => b[1] - a[1]).map(([login]) => login);
}

async function activitySection(repos) {
  const stats = await Promise.all(repos.map((r) => get(`/repos/${ORG}/${r.name}/stats/participation`).catch(() => null)));
  const ok = stats.filter((s) => s?.all?.length);
  if (!ok.length) throw new Error('participation stats not ready');
  return Array.from({ length: 52 }, (_, w) => ok.reduce((n, s) => n + (s.all[w] ?? 0), 0));
}

// Live data when the API answers. Anything that fails keeps its last known good value (cache, then the committed
// snapshot) instead of going blank, and `source`/`stale` say what happened. A fully live cache under 15 min old is
// reused so repeated local builds don't burn the 60 req/h unauthenticated limit.
export async function loadGithub({ cache = '.cache/github.json', maxAge = 15 * 60_000 } = {}) {
  const [snapshot, cached] = await Promise.all([readJson(SNAPSHOT), readJson(cache)]);
  if (cached?.source === 'live' && Date.now() - new Date(cached.fetchedAt) < maxAge) return cached;
  const base = { ...snapshot, ...cached };

  let repos;
  try {
    repos = (await pages(`/orgs/${ORG}/repos?per_page=100&type=public`)).filter((r) => !r.fork && !r.archived);
  } catch (e) {
    console.warn(`[github] ${e.message}; using ${cached ? 'cached' : 'committed snapshot'} data. Set GITHUB_TOKEN for a higher rate limit.`);
    return { ...base, source: cached ? 'cached' : 'snapshot', stale: [] };
  }

  const run = async (name, fn) => {
    try { return [name, await fn()]; } catch (e) { console.warn(`[github] ${name}: ${e.message}`); return [name, undefined]; }
  };
  const results = await Promise.all([
    run('members', membersSection),
    run('feeds', () => feedsSection(repos)),
    run('people', () => peopleSection(repos)),
    run('activity', () => activitySection(repos)),
  ]);
  const got = Object.fromEntries(results);
  const stale = results.filter(([, v]) => v === undefined).map(([n]) => n);

  const data = {
    ...base,
    source: stale.length ? 'partial' : 'live',
    stale,
    fetchedAt: new Date().toISOString(),
    repos: repos.map((r) => ({
      name: r.name, description: r.description, language: r.language, stars: r.stargazers_count, forks: r.forks_count,
      license: r.license?.spdx_id ?? null, topics: r.topics ?? [], pushed: r.pushed_at,
    })),
    ...(got.members && { members: got.members }),
    ...got.feeds,
    ...(got.activity && { activity: got.activity }),
    contributors: union(got.people ?? [], base.contributors ?? []), // only ever grows, so a flaky page can't drop people
  };
  await mkdir(dirname(cache), { recursive: true }).then(() => writeFile(cache, JSON.stringify(data))).catch(() => {});
  return data;
}
