// Edge cases for the build-time GitHub data: `node test.mjs`. Stubs fetch, so it never touches the network.
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadGithub } from './src/github.mjs';

console.warn = () => {};
const json = (body, headers = {}) => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } });
const repo = (name) => ({ name, description: name, language: 'Go', stargazers_count: 1, forks_count: 0, license: { spdx_id: 'Apache-2.0' }, topics: [], pushed_at: '2026-01-01T00:00:00Z', open_issues_count: 3, fork: false, archived: false });
const item = (n, r, login = 'someone', type = 'User') => ({ number: n, title: `item ${n}`, repository_url: `https://api.github.com/repos/Ergane-Foundation/${r}`, html_url: `https://github.com/x/${n}`, closed_at: `2026-01-0${n}T00:00:00Z`, updated_at: '', user: { login, type } });

// opts: down (network error), searchStatus (e.g. 403), goodFirst (items)
const stub = ({ down = false, searchStatus = 200, goodFirst = [item(9, 'adbt')] } = {}) => {
  globalThis.fetch = async (url) => {
    const u = decodeURIComponent(String(url));
    if (down) throw new TypeError('network down');
    if (u.includes('/search/issues') && searchStatus !== 200) return new Response('{"message":"rate limit"}', { status: searchStatus });
    if (u.includes('/orgs/Ergane-Foundation/repos')) return json([repo('adbt'), repo('vajra')]);
    if (u.includes('/public_members')) return json([{ login: 'maint', type: 'User' }]);
    if (u.includes('/contributors')) return json([{ login: 'committer', type: 'User', contributions: 5 }, { login: 'dependabot[bot]', type: 'Bot', contributions: 9 }]);
    if (u.includes('/stats/participation')) return json({ all: Array(52).fill(1) });
    if (u.includes('is:pr is:merged')) return json({ items: [item(1, 'vajra'), item(2, 'adbt')] });
    if (u.includes('is:pr is:open')) return json({ total_count: 2, items: [] });
    if (u.includes('good first issue')) return json({ items: goodFirst });
    // every PR, in two pages: exercises pagination and bot filtering
    if (u.includes('page=2')) return json({ items: [item(4, 'adbt', 'pr-page-two')] });
    return json({ items: [item(3, 'vajra', 'pr-page-one'), item(5, 'vajra', 'github-actions[bot]', 'Bot')] }, { link: '<https://api.github.com/search/issues?q=org:Ergane-Foundation%20is:pr&per_page=100&page=2>; rel="next"' });
  };
};
const cache = async () => join(await mkdtemp(join(tmpdir(), 'ergane-')), 'github.json');

// 1. healthy: everyone with a commit or PR is listed once, bots are not, feeds are newest first
stub();
let c = await cache();
let d = await loadGithub({ cache: c, maxAge: 0 });
assert.equal(d.source, 'live');
assert.deepEqual(d.stale, []);
assert.deepEqual(d.members, ['maint']);
for (const login of ['committer', 'pr-page-one', 'pr-page-two']) assert.ok(d.contributors.includes(login), `${login} missing`);
assert.ok(!d.contributors.some((l) => l.includes('[bot]')), 'bots must be excluded');
assert.equal(d.mergedPrs.length > 0, true);
assert.equal(new Set(d.contributors.map((l) => l.toLowerCase())).size, d.contributors.length, 'duplicates');
assert.deepEqual(d.mergedPrs.map((p) => p.number), [2, 1]);
assert.equal(d.openPrs, 2);
assert.equal(d.openIssues, 4); // 2 repos × 3 open items − 2 PRs
assert.equal(d.activity.length, 52);

// 2. search gets rate limited on the next build: feeds and people keep their previous values instead of going blank
stub({ searchStatus: 403 });
let d2 = await loadGithub({ cache: c, maxAge: 0 });
assert.equal(d2.source, 'partial');
assert.deepEqual(d2.stale.sort(), ['feeds', 'people']);
assert.deepEqual(d2.mergedPrs, d.mergedPrs);
assert.deepEqual(d2.contributors, d.contributors);

// 3. "GitHub says zero" is real data, not a failure
stub({ goodFirst: [] });
d = await loadGithub({ cache: await cache(), maxAge: 0 });
assert.equal(d.source, 'live');
assert.deepEqual(d.goodFirst, []);

// 4. API completely down: last cache wins, and with no cache the committed snapshot still has real feed data
stub({ down: true });
assert.equal((await loadGithub({ cache: c, maxAge: 0 })).source, 'cached');
d = await loadGithub({ cache: await cache(), maxAge: 0 });
assert.equal(d.source, 'snapshot');
assert.ok(d.mergedPrs.length && d.goodFirst.length && d.contributors.length && d.members.length, 'snapshot.json has empty sections; run `node build.mjs --snapshot`');

// 5. a fully live cache inside maxAge is reused without any network
stub({ down: true });
c = await cache();
stub();
await loadGithub({ cache: c, maxAge: 0 });
stub({ down: true });
assert.equal((await loadGithub({ cache: c })).source, 'live');

console.log('github data ok');
