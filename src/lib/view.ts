import { FEED_MAX } from './site';
import type { GH, Item } from './github';

export const day = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

// Core members are the org's public members. Contributors are everyone else with a commit or PR (deduped, case-insensitive).
export function people(gh: Pick<GH, 'members' | 'contributors'>) {
  const seen = new Set<string>();
  const fresh = (l: string) => !seen.has(l.toLowerCase()) && !!seen.add(l.toLowerCase());
  const core = gh.members.filter(fresh);
  return { core, contributors: gh.contributors.filter(fresh) };
}

// At most FEED_MAX of each. goodFirst may be topped up with the newest open issues (gfi === false, see github.ts),
// so the heading says what the list really contains. Items without the flag (older snapshot) count as good first.
export function feedView(gh: Pick<GH, 'mergedPrs' | 'goodFirst'>) {
  const merged: Item[] = gh.mergedPrs.slice(0, FEED_MAX);
  const good: Item[] = gh.goodFirst.slice(0, FEED_MAX);
  const gfi = good.filter((i) => i.gfi !== false).length;
  const heading = !good.length || gfi === good.length ? 'Good first issues' : gfi ? 'Good first & latest issues' : 'Latest open issues';
  return { merged, good, heading, tagGfi: gfi > 0 && gfi < good.length };
}

// Heat level 0-4 for each of the last 52 weeks.
export function heatLevels(weeks: number[]) {
  const max = Math.max(1, ...weeks);
  const cells = weeks.length ? weeks : Array<number>(52).fill(0);
  return cells.map((n) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((n / max) * 3.99))));
}
