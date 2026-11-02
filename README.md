# official-website
The official website of Ergane Foundation - an open-source organization building innovative software, fostering collaborative development, and advancing accessible technology through community-driven projects.

## Develop

No dependencies, Node 20+.

```bash
npm run dev     # build + serve on http://localhost:4321, rebuilds when src/ changes
npm run build   # write static files to dist/
npm run check   # build, then verify every internal link and anchor
```

## Deploy (Vercel)

`vercel.json` already points Vercel at `npm run build` and `dist/`. Add a `GITHUB_TOKEN` environment variable in the Vercel project (a token with no scopes is enough) so the build-time GitHub fetch isn't rate-limited; without it the build falls back to `src/snapshot.json`. Add a Deploy Hook and call it on a schedule to keep the live numbers fresh.

Serving from a sub-path instead: `BASE=/sub-path npm run build`.

## Layout

- `src/site.mjs` – links, nav, project copy, the Vajra pipeline content. Edit text here.
- `src/github.mjs` – build-time GitHub data (stars, merged PRs, good first issues, contributors, weekly activity). Falls back to `src/snapshot.json` when the API is unreachable. Set `GITHUB_TOKEN` for a higher rate limit. Results are cached 15 min in `.cache/`.
- `src/pages/*.mjs` – one file per route group; `src/layout.mjs` is the shell; `src/parts.mjs` holds shared blocks.
- `src/assets/` – `style.css` (design tokens at the top), `app.js` (palette, theme, stages, filters), `lattice.js` (WebGL hero).

The live numbers are only as fresh as the last build, so rebuild on a schedule (or on push) to keep them current.

Fonts: Geist and Geist Mono, SIL Open Font License 1.1.
