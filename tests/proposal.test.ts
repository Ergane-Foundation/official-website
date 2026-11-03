// The proposal form's server side: validation, the branch for unclear ownership, the public post it produces, and the
// GitHub calls: `npm test`. Stubs fetch, so it never touches the network.
import assert from 'node:assert/strict';
import { buildDiscussion, parseProposal, submitProposal, tooMany } from '../src/lib/proposal';
import { NOT_OWNER, steps, stepsFor, type Values } from '../src/lib/proposal-form';

// A complete set of answers built from the question list itself, so it stays valid when questions change.
const sample = (f: (typeof steps)[number]['fields'][number]) =>
  f.kind === 'choice' ? f.options[0] : f.kind === 'url' ? 'https://github.com/someone/aegis' : f.kind === 'github' ? '@someone' : f.kind === 'long' ? 'A small tool that checks signed releases.' : 'Jane Doe';
const good: Values = Object.fromEntries(steps.flatMap((s) => s.fields.map((f) => [f.name, sample(f)])));
const form = (o: Values) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const field = (name: string) => steps.flatMap((s) => s.fields).find((f) => f.name === name)!;

// 1. the questions themselves
const names = steps.flatMap((s) => s.fields.map((f) => f.name));
assert.equal(new Set(names).size, names.length, 'field names are unique');
const rights = field('rights');
assert.ok(rights.kind === 'choice' && rights.options.includes(NOT_OWNER), 'the ownership branch has its answer');
assert.deepEqual(stepsFor('Yes').map((s) => s.id), ['you', 'experience', 'project', 'quality', 'commitment']);
assert.deepEqual(stepsFor(NOT_OWNER).map((s) => s.id), ['you', 'experience', 'project', 'quality', 'ownership'], 'unclear ownership skips Commitment and ends on the notice');

// 2. validation
const ok = parseProposal(form(good));
assert.ok(ok.ok, 'a complete proposal is accepted');
if (ok.ok) assert.equal(ok.value.github, 'https://github.com/someone', 'a bare @handle becomes a profile URL');
for (const [what, patch, key] of [
  ['short name', { fullName: 'A' }, 'fullName'],
  ['unknown designation', { role: 'Wizard' }, 'role'],
  ['prototype key as a choice', { merged: 'constructor' }, 'merged'],
  ['http repo', { repo: 'http://github.com/a/b' }, 'repo'],
  ['javascript: repo', { repo: 'javascript:alert(1)' }, 'repo'],
  ['not a url', { repo: 'github.com/a/b' }, 'repo'],
  ['profile on another site', { github: 'https://example.com/someone' }, 'github'],
  ['bad handle', { github: 'not a handle!' }, 'github'],
  ['trailing hyphen handle', { github: 'name-' }, 'github'],
  ['short description', { about: 'too short' }, 'about'],
  ['over 100 words', { about: Array(101).fill('word').join(' ') }, 'about'],
  ['over the character cap', { why: 'x'.repeat(1501) }, 'why'],
] as const) {
  const r = parseProposal(form({ ...good, ...patch }));
  assert.ok(!r.ok && key in r.errors, `${what} must be rejected on "${key}"`);
}
assert.ok(parseProposal(form({ ...good, about: Array(100).fill('word').join(' ') })).ok, 'exactly 100 words is allowed');
assert.ok(parseProposal(form({ ...good, github: 'https://github.com/someone/' })).ok, 'a profile URL with a trailing slash is accepted');
const optional = parseProposal(form({ ...good, why: '' }));
assert.ok(optional.ok, 'the optional "why" can be left empty');

const empty = parseProposal(new FormData());
assert.ok(!empty.ok && ['fullName', 'repo', 'rights', 'time', 'review'].every((k) => k in empty.errors), 'an empty form fails every required answer, Commitment included');

// 3. unclear ownership: Commitment is not asked, and the post says so
const held = { ...good, rights: NOT_OWNER };
delete (held as Partial<Values>).time;
delete (held as Partial<Values>).review;
delete (held as Partial<Values>).why;
const heldParsed = parseProposal(form(held));
assert.ok(heldParsed.ok, 'no Commitment answers are needed when ownership is unclear');
if (heldParsed.ok) {
  const { body } = buildDiscussion(heldParsed.value);
  assert.ok(body.startsWith('> **Ownership of the code is not yet clear.**'), 'the post leads with the ownership note');
  assert.ok(!body.includes('### Commitment'), 'no Commitment section');
}
assert.ok(!parseProposal(form({ ...good, time: '' })).ok, 'with clear ownership, Commitment is required');

// 4. the post is public: it must not notify strangers or link into other repositories
const hostile = parseProposal(form({ ...good, fullName: 'Aegis\n@everyone', about: 'Ping @torvalds and see Ergane-Foundation/vajra#1 or #2 now.\n### Injected heading\u0007‮' }));
assert.ok(hostile.ok);
if (hostile.ok) {
  const { title, body } = buildDiscussion(hostile.value);
  assert.equal(title, 'Proposal: someone/aegis', 'titled by repository');
  assert.ok(!/@(?!​)/.test(title + body), 'no live @mention');
  assert.ok(!/#(?=\d)/.test(body), 'no live issue reference');
  assert.ok(!/[\u0007‮]/.test(body), 'control and bidi characters are stripped');
  assert.ok(!/^### Injected/m.test(body), 'a pasted heading stays inside its quote');
  assert.ok(body.includes('> ### Injected heading'), 'long answers are quoted line by line');
  assert.ok(body.includes('<https://github.com/someone/aegis>') && body.includes('<https://github.com/someone>'), 'repository and profile are linked');
  for (const s of stepsFor('Yes')) assert.ok(body.includes(`### ${s.title}`), `section "${s.title}"`);
}

// 5. GitHub calls
type Call = { query: string; variables: Record<string, any>; auth: string | null };
let calls: Call[] = [];
const stub = (reply: (c: Call) => unknown, status = 200) => {
  calls = [];
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const c: Call = { ...JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get('authorization') };
    calls.push(c);
    return new Response(JSON.stringify(reply(c)), { status });
  }) as typeof fetch;
};
const repoReply = (names: string[]) => ({ data: { repository: { id: 'R_1', discussionCategories: { nodes: names.map((n, i) => ({ id: `C_${i}`, name: n })) } } } });
const proposal = ok.ok ? ok.value : (undefined as never);

async function main() {
  // the right category is chosen by name, case-insensitively, and the discussion URL comes back
  stub((c) => (c.query.startsWith('query') ? repoReply(['General', 'proposals']) : { data: { createDiscussion: { discussion: { url: 'https://github.com/x/y/discussions/7' } } } }));
  assert.equal(await submitProposal(proposal, 'tok'), 'https://github.com/x/y/discussions/7');
  assert.equal(calls.length, 2);
  assert.deepEqual([calls[1].variables.repo, calls[1].variables.cat], ['R_1', 'C_1']);
  assert.equal(calls[1].variables.title, 'Proposal: someone/aegis');
  assert.equal(calls[1].auth, 'Bearer tok');

  // failures all throw, and none leaks the token
  await assert.rejects(() => submitProposal(proposal, ''), /PROPOSALS_TOKEN/);
  stub(() => repoReply(['General']));
  await assert.rejects(() => submitProposal(proposal, 'secret-token'), /category "Proposals" not found/);
  stub(() => ({ errors: [{ message: 'Resource not accessible by personal access token' }] }));
  await assert.rejects(() => submitProposal(proposal, 'secret-token'), (e: Error) => /not accessible/.test(e.message) && !e.message.includes('secret-token'));
  stub(() => ({ message: 'Bad credentials' }), 401);
  await assert.rejects(() => submitProposal(proposal, 'secret-token'), /401/);
  stub(() => ({ data: { repository: null } }));
  await assert.rejects(() => submitProposal(proposal, 'secret-token'), /not visible/);

  // 6. rate limit: three per window per address, then it resets
  assert.deepEqual([1, 2, 3, 4].map(() => tooMany('a', 1_000)), [false, false, false, true]);
  assert.equal(tooMany('b', 1_000), false, 'another address is unaffected');
  assert.equal(tooMany('a', 1_000 + 10 * 60_000 + 1), false, 'the window expires');

  console.log('proposal flow ok');
}
main();
