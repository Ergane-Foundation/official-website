// Edge cases for the GitHub data layer and the pulse lists: `npm test`. Stubs fetch, so it never touches the network.
import assert from 'node:assert/strict';
import { loadGithub } from '../src/lib/github';
import { feedView, heatLevels, people } from '../src/lib/view';

console.warn = () => {};
const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } });
const repo = (name: string) => ({ name, description: name, language: 'Go', stargazers_count: 1, forks_count: 0, license: { spdx_id: 'Apache-2.0' }, topics: [], pushed_at: '2026-01-01T00:00:00Z', open_issues_count: 3, fork: false, archived: false });
const day = (n: number) => `2026-01-${String(n).padStart(2, '0')}T00:00:00Z`;
const item = (n: number, r: string, login = 'someone', type = 'User') => ({
  number: n, title: `item ${n}`, repository_url: `https://api.github.com/repos/Ergane-Foundation/${r}`, html_url: `https://github.com/x/${n}`,
  closed_at: day(n), created_at: day(n), updated_at: day(n), user: { login, type },
});

let calls: string[] = [];
type Opts = { down?: boolean; searchStatus?: number; merged?: unknown[]; goodFirst?: unknown[]; latest?: unknown[] };
const stub = ({ down = false, searchStatus = 200, merged = [item(1, 'vajra'), item(2, 'adbt')], goodFirst = [item(9, 'adbt')], latest = [item(11, 'adbt'), item(12, 'vajra'), item(9, 'adbt')] }: Opts = {}) => {
  calls = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = decodeURIComponent(String(url));
    calls.push(u);
    if (down) throw new TypeError('network down');
    if (u.includes('/search/issues') && searchStatus !== 200) return new Response('{"message":"rate limit"}', { status: searchStatus });
    if (u.includes('/orgs/Ergane-Foundation/repos')) return json([repo('adbt'), repo('vajra')]);
    if (u.includes('/public_members')) return json([{ login: 'maint', type: 'User' }]);
    if (u.includes('/contributors')) return json([{ login: 'committer', type: 'User', contributions: 5 }, { login: 'dependabot[bot]', type: 'Bot', contributions: 9 }]);
    if (u.includes('/stats/participation')) return json({ all: Array(52).fill(1) });
    if (u.includes('is:pr is:merged')) return json({ items: merged });
    if (u.includes('is:pr is:open')) return json({ total_count: 2, items: [] });
    if (u.includes('good first issue')) return json({ items: goodFirst });
    if (u.includes('is:issue is:open')) return json({ items: latest });
    // every PR, in two pages: exercises pagination and bot filtering
    if (u.includes('page=2')) return json({ items: [item(4, 'adbt', 'pr-page-two')] });
    return json({ items: [item(3, 'vajra', 'pr-page-one'), item(5, 'vajra', 'github-actions[bot]', 'Bot')] }, { link: '<https://api.github.com/search/issues?q=org:Ergane-Foundation%20is:pr&per_page=100&page=2>; rel="next"' });
  }) as typeof fetch;
};

async function main() {
  // 1. healthy: everyone with a commit or PR is listed once, bots are not, feeds are newest first
  stub();
  let d = await loadGithub();
  assert.equal(d.source, 'live');
  assert.deepEqual(d.stale, []);
  assert.deepEqual(d.members, ['maint']);
  for (const login of ['committer', 'pr-page-one', 'pr-page-two']) assert.ok(d.contributors.includes(login), `${login} missing`);
  assert.ok(!d.contributors.some((l) => l.includes('[bot]')), 'bots must be excluded');
  assert.equal(new Set(d.contributors.map((l) => l.toLowerCase())).size, d.contributors.length, 'duplicates');
  assert.deepEqual(d.mergedPrs.map((p) => p.number), [2, 1]);
  assert.equal(d.openPrs, 2);
  assert.equal(d.openIssues, 4); // 2 repos × 3 open items − 2 PRs
  assert.equal(d.activity.length, 52);

  // 2. fewer than 5 good first issues: topped up with the newest open issues, good first ones first, no duplicates
  assert.deepEqual(d.goodFirst.map((i) => [i.number, i.gfi]), [[9, true], [11, false], [12, false]]);

  // 3. search gets rate limited: feeds and people fall back to the snapshot instead of going blank
  stub({ searchStatus: 403 });
  d = await loadGithub();
  assert.equal(d.source, 'partial');
  assert.deepEqual([...d.stale].sort(), ['feeds', 'people']);
  assert.ok(d.mergedPrs.length > 0 && d.goodFirst.length > 0 && d.contributors.length > 0);
  assert.equal(d.repos.length, 2); // repos are still live

  // 4. no good first issues at all: the list is the latest open issues, still real data (not a failure)
  stub({ goodFirst: [] });
  d = await loadGithub();
  assert.equal(d.source, 'live');
  assert.ok(d.goodFirst.length > 0 && d.goodFirst.every((i) => i.gfi === false));

  // 5. plenty of both: each list is capped at 5 (newest merged PRs), and the top-up query is never made
  stub({ merged: [1, 2, 3, 4, 5, 6, 7].map((n) => item(n, 'vajra')), goodFirst: [1, 2, 3, 4, 5, 6].map((n) => item(n + 20, 'adbt')) });
  d = await loadGithub();
  assert.deepEqual(d.mergedPrs.map((p) => p.number), [7, 6, 5, 4, 3]);
  assert.equal(d.goodFirst.length, 5);
  assert.ok(d.goodFirst.every((i) => i.gfi));
  assert.ok(!calls.some((u) => u.includes('is:issue is:open') && !u.includes('good first issue')), 'top-up query must be skipped');

  // 6. API completely down: the committed snapshot still has real data in every section
  stub({ down: true });
  d = await loadGithub();
  assert.equal(d.source, 'snapshot');
  assert.ok(d.repos.length && d.mergedPrs.length && d.goodFirst.length && d.contributors.length && d.members.length, 'snapshot.json has empty sections; run `npm run snapshot`');

  // 7. view helpers: never more than 5 rows, the heading says what the list contains, people are split and deduped
  const many = (n: number, gfi?: boolean) => Array.from({ length: n }, (_, i) => ({ number: i + 1, title: `t${i}`, repo: 'r', url: `https://x/${i}`, at: day(i + 1), ...(gfi === undefined ? {} : { gfi }) }));
  let v = feedView({ mergedPrs: many(8), goodFirst: many(8) }); // old snapshot shape: no flag, more than 5
  assert.equal(v.merged.length, 5);
  assert.equal(v.good.length, 5);
  assert.equal(v.heading, 'Good first issues');
  assert.equal(v.tagGfi, false);
  v = feedView({ mergedPrs: [], goodFirst: [...many(2, true), ...many(3, false)] });
  assert.equal(v.heading, 'Good first & latest issues');
  assert.equal(v.tagGfi, true);
  v = feedView({ mergedPrs: [], goodFirst: many(5, false) });
  assert.equal(v.heading, 'Latest open issues');
  assert.equal(v.tagGfi, false);
  assert.equal(feedView({ mergedPrs: [], goodFirst: [] }).heading, 'Good first issues');

  assert.deepEqual(people({ members: ['Ann', 'bob'], contributors: ['ann', 'carol', 'BOB', 'dave'] }), { core: ['Ann', 'bob'], contributors: ['carol', 'dave'] });
  assert.deepEqual(heatLevels([0, 1, 4]), [0, 1, 4]);
  assert.equal(heatLevels([]).length, 52);

  console.log('github data ok');
}

main().catch((e) => { console.error(e); process.exit(1); });
