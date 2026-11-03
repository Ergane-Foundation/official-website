import type { GH, Repo } from './github';

export const ORG = 'Ergane-Foundation';
export const FEED_MAX = 5; // items per "pulse" list

export const links = {
  github: `https://github.com/${ORG}`,
  discord: 'https://discord.gg/b4BQzQX5z',
  propose: 'https://forms.gle/LYJvszzPkoqof9xLA',
  goodFirst: `https://github.com/search?q=${encodeURIComponent(`org:${ORG} label:"good first issue" state:open`)}&type=issues`,
  mergedPrs: `https://github.com/search?q=${encodeURIComponent(`org:${ORG} is:pr is:merged`)}&type=pullrequests`,
};

// Good first issues for one repository.
export const repoGoodFirst = (slug: string) =>
  `https://github.com/search?q=${encodeURIComponent(`repo:${ORG}/${slug} label:"good first issue" is:open`)}&type=issues`;

export const nav = [
  { label: 'Projects', href: '/projects' },
  { label: 'Community', href: '/community' },
  { label: 'Research', href: '/research' },
] as const;

// Curated per-repo copy. Live GitHub data (stars, description, topics) is merged over it.
type Meta = { name: string; domain: string; tagline: string };
const meta: Record<string, Meta> = {
  vajra: { name: 'Vajra', domain: 'Network Security', tagline: 'Inline intrusion prevention with automated response, built on Suricata.' },
  watchdog: { name: 'Watchdog', domain: 'Network Security', tagline: 'Guided, pentester-style network security assessment for Android, Windows and Linux.' },
  faceproof: { name: 'Faceproof', domain: 'AI/ML', tagline: 'Offline face verification and liveness for React Native. Biometric data never leaves the device.' },
  solstice: { name: 'Solstice', domain: 'Infrastructure', tagline: 'Carbon-aware suspension for stateful Apache Flink jobs on Kubernetes.' },
  adbt: { name: 'adbt', domain: 'Tooling', tagline: 'A modern, keyboard-driven Android Debug Bridge TUI.' },
};
export const projectSlugs = Object.keys(meta);

export type Project = Repo & Meta & { slug: string; url: string };

export function catalog(gh: Pick<GH, 'repos'>): Project[] {
  return gh.repos
    .filter((r) => meta[r.name])
    .map((r) => ({ ...r, ...meta[r.name], slug: r.name, url: `https://github.com/${ORG}/${r.name}` }))
    .sort((a, b) => projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug));
}

export const pillars = [
  { id: '01', title: 'Security Infrastructure', body: 'Inline intrusion prevention and pentester-style network assessment, designed to fail safe.', repos: ['vajra', 'watchdog'] },
  { id: '02', title: 'On-Device AI', body: 'Face verification and liveness that run offline. No cloud API, no per-call cost, and biometric data stays on the device.', repos: ['faceproof'] },
  { id: '03', title: 'Systems & Tooling', body: 'Developer tools and operators for the stack underneath: an ADB terminal UI, and carbon-aware suspension for Flink on Kubernetes.', repos: ['adbt', 'solstice'] },
  { id: '04', title: 'Core-Team Stewardship', body: 'Core members make the decisions that shape the foundation, and every repository has one or more of them assigned. Contributions are welcome from anyone, under Apache-2.0 unless a project says otherwise.', repos: [] as string[] },
];

export const contributionSteps: [string, string][] = [
  ['Pick or open an issue', 'Start with any issue labelled “good first issue”, or open one describing what you want to change. Small, focused changes land fastest.'],
  ['Talk it through', 'Say hello in Discord. The core members assigned to the project can tell you whether the idea fits and where to start in the code.'],
  ['Open a pull request', 'Fork the repository, make the change, and open a pull request. The core members assigned to that repository review it; projects with automated checks run them on every PR.'],
  ['Merge and ship', 'Once reviewed and passing, a core member merges it. Your commit is credited to you and released under the project license.'],
];
