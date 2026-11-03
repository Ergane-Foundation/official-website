import { NOT_OWNER, REPO, stepsFor, words, type Errors, type Values } from './proposal-form';
import { ORG } from './site';

// A project proposal from /propose, posted as a discussion in this (public) repository. Everything submitted is public,
// so the form deliberately asks for no email address. The questions live in proposal-form.ts.
const CATEGORY = () => process.env.PROPOSALS_CATEGORY || 'Proposals';
const HANDLE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const MAX_TEXT = 120;
const MAX_LONG = 1500;

export type Parsed = { ok: true; value: Values } | { ok: false; values: Values; errors: Errors };

// Checks every answer the chosen path asks for. The returned values are normalised (URLs, whitespace) and are also what
// the form shows again after an error.
export function parseProposal(form: FormData): Parsed {
  const raw = (k: string) => String(form.get(k) ?? '').trim();
  const values: Values = {};
  const errors: Errors = {};

  for (const step of stepsFor(raw('rights'))) {
    for (const f of step.fields) {
      let v = raw(f.name);
      if (!v) {
        values[f.name] = '';
        if (!f.optional) errors[f.name] = f.kind === 'choice' ? 'Choose one.' : 'This answer is required.';
        continue;
      }
      if (f.kind === 'text') {
        v = v.replace(/\s+/g, ' ');
        if (v.length < 2 || v.length > MAX_TEXT) errors[f.name] = `Use 2 to ${MAX_TEXT} characters.`;
      } else if (f.kind === 'url') {
        try {
          const u = new URL(v);
          if (u.protocol !== 'https:' || v.length > 200) throw new Error();
          v = u.href; // normalised; any "<" or ">" is percent-encoded, so it can't break out of the link
        } catch {
          errors[f.name] = 'Enter the https:// address.';
        }
      } else if (f.kind === 'github') {
        const m = /^(?:https?:\/\/(?:www\.)?github\.com\/)?@?([^/\s]+)\/?$/i.exec(v);
        if (m && HANDLE.test(m[1])) v = `https://github.com/${m[1]}`;
        else errors[f.name] = 'Enter your profile address, for example https://github.com/yourname.';
      } else if (f.kind === 'long') {
        if (v.length > MAX_LONG) errors[f.name] = `Keep it under ${MAX_LONG} characters.`;
        else if (f.words && words(v) > f.words) errors[f.name] = `Use ${f.words} words or fewer.`;
        else if (!f.optional && v.length < 20) errors[f.name] = 'Please say a little more (at least 20 characters).';
      } else if (!f.options.includes(v)) {
        errors[f.name] = 'Choose one.';
      }
      values[f.name] = v;
    }
  }
  return Object.keys(errors).length ? { ok: false, values, errors } : { ok: true, value: values };
}

// User text goes into a public post, so it must not notify strangers or create links on other repositories.
// ponytail: only "@name" and "#123" are defused; GitHub already sanitises HTML, and links in a proposal are the core team's call.
const clean = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '').replace(/@/g, '@​').replace(/#(?=\d)/g, '#​');

// The post: titled by repository, then one section per step with a question and its answer on each line. Long answers
// are quoted line by line, so a pasted heading or list can't break out of its quote.
export function buildDiscussion(v: Values) {
  const repo = new URL(v.repo);
  const title = `Proposal: ${clean(repo.pathname.split('/').filter(Boolean).slice(0, 2).join('/') || repo.hostname)}`.slice(0, 100);

  const sections = stepsFor(v.rights)
    .filter((s) => s.fields.length)
    .map((s) => {
      const parts = s.fields.flatMap((f) => {
        const a = v[f.name];
        if (!a) return [];
        if (f.kind === 'long') return [{ list: false, text: `**${f.label}**\n\n${clean(a).replace(/^/gm, '> ')}` }];
        const shown = f.kind === 'url' || f.kind === 'github' ? `<${a}>` : `**${clean(a)}**`;
        return [{ list: true, text: `- ${f.label} — ${shown}` }];
      });
      const text = parts.reduce((out, p, i) => out + (i === 0 ? '' : parts[i - 1].list && p.list ? '\n' : '\n\n') + p.text, '');
      return `### ${s.title}\n\n${text}`;
    });

  const held = v.rights === NOT_OWNER
    ? ['> **Ownership of the code is not yet clear.** This proposal is on record only. It can be considered once ownership is clear and every co-author has agreed.']
    : [];
  const body = [...held, ...sections, '---\n*Submitted through the proposal form on the Ergane Foundation website. A core member will reply here.*'].join('\n\n');
  return { title, body };
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ergane-website' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.errors) throw new Error(`GitHub GraphQL ${r.status}: ${j?.errors?.map((e: { message: string }) => e.message).join('; ') ?? j?.message ?? 'no response body'}`);
  return j.data as T;
}

// Opens the discussion and returns its URL. Throws on any failure; the caller shows a generic message and logs the reason.
export async function submitProposal(v: Values, token = process.env.PROPOSALS_TOKEN): Promise<string> {
  if (!token) throw new Error('PROPOSALS_TOKEN is not set');
  const found = await gql<{ repository: { id: string; discussionCategories: { nodes: { id: string; name: string }[] } } | null }>(
    token,
    'query($owner:String!,$name:String!){repository(owner:$owner,name:$name){id discussionCategories(first:25){nodes{id name}}}}',
    { owner: ORG, name: REPO },
  );
  const repo = found.repository;
  if (!repo) throw new Error(`repository ${ORG}/${REPO} not visible to the token`);
  const category = repo.discussionCategories.nodes.find((c) => c.name.toLowerCase() === CATEGORY().toLowerCase());
  if (!category) throw new Error(`discussion category "${CATEGORY()}" not found (have: ${repo.discussionCategories.nodes.map((c) => c.name).join(', ')})`);

  const { title, body } = buildDiscussion(v);
  const made = await gql<{ createDiscussion: { discussion: { url: string } } }>(
    token,
    'mutation($repo:ID!,$cat:ID!,$title:String!,$body:String!){createDiscussion(input:{repositoryId:$repo,categoryId:$cat,title:$title,body:$body}){discussion{url}}}',
    { repo: repo.id, cat: category.id, title, body },
  );
  return made.createDiscussion.discussion.url;
}

// Per-instance rate limit: 3 proposals per 10 minutes from one address.
// ponytail: in memory, so each serverless instance counts on its own; add Cloudflare Turnstile or a shared store if it is abused.
const WINDOW = 10 * 60_000;
const MAX = 3;
const hits = new Map<string, number[]>();
export function tooMany(key: string, now = Date.now()) {
  if (hits.size > 1000) hits.clear();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= MAX) return true;
  hits.set(key, [...recent, now]);
  return false;
}
