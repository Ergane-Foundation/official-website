# official-website
The official website of Ergane Foundation - an open-source organization building innovative software, fostering collaborative development, and advancing accessible technology through community-driven projects.

Built with Next.js (App Router), React and TypeScript. The hero background is a custom shader rendered with three.js through react-three-fiber.

## Develop

Node 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run check      # typecheck, data tests, production build
npm run snapshot   # refresh src/data/snapshot.json from a fully live GitHub fetch
```

## Deploy (Vercel)

Vercel detects Next.js; no configuration is needed. Add a `GITHUB_TOKEN` environment variable (a token with no scopes is enough) so the GitHub data isn't rate-limited. Pages are statically generated and revalidate hourly (ISR), so the stats, merged PRs, issues and contributors refresh without a redeploy.

### Project proposals

`/propose` is a multi-step form on the site. Each submission is posted as a **public discussion** in this repository's Discussions tab, so it asks for no email address. The questions, their options and the ownership branch ("No / not sure" skips Commitment and ends on a notice) are all defined in `src/lib/proposal-form.ts`; the form, the validation and the post are generated from it. One-time setup:

1. In the repository, enable Discussions and add a category named **Proposals** (Settings → General → Features → Discussions, then the pencil next to Categories; format "Open-ended discussion"). To use another category, set `PROPOSALS_CATEGORY` to its name.
2. Create a fine-grained personal access token: resource owner `Ergane-Foundation`, only this repository, permission **Discussions: Read and write**. Use a dedicated account if you can, since discussions are posted as the token's owner. If the organisation requires approval for fine-grained tokens, approve it in the organisation settings.
3. Add it to Vercel as `PROPOSALS_TOKEN` (Production, and Preview if you want to test there) and redeploy.

Without the token the form still renders, and a submission shows a "could not post" message with a link to open the discussion on GitHub by hand. Only the server holds the token; it never reaches the browser.

## Layout

- `src/app` – routes: `/`, `/projects`, `/projects/[slug]`, `/community`, `/research`, `/research/[slug]`, `/propose`. `globals.css` holds the design tokens.
- `src/lib/site.ts` – links, nav, project copy, the Vajra pipeline content. Edit text here.
- `src/lib/github.ts` – GitHub data: stars, merged PRs, good first issues, org members, everyone with a commit or PR, weekly activity. Each section falls back on its own to `src/data/snapshot.json`, so a rate limit or outage never leaves a section blank; the stats bar says which source was used.
- `src/lib/view.ts` – pure helpers (people split, pulse lists, heat levels), covered by `tests/`.
- `src/components` – shared UI. `Lattice.tsx` is the 3D hero (loaded lazily, paused off-screen, respects reduced motion); `Palette.tsx` is the Ctrl/Cmd+K search.
- `src/content/research.tsx` – research notes as JSX.

Fonts: Geist and Geist Mono, SIL Open Font License 1.1.
