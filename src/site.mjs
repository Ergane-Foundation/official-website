export const ORG = 'Ergane-Foundation';
export const FEED_MAX = 5; // items per "pulse" list

export const links = {
  github: `https://github.com/${ORG}`,
  discord: 'https://discord.gg/b4BQzQX5z',
  propose: 'https://forms.gle/LYJvszzPkoqof9xLA',
  goodFirst: `https://github.com/search?q=${encodeURIComponent(`org:${ORG} label:"good first issue" state:open`)}&type=issues`,
  mergedPrs: `https://github.com/search?q=${encodeURIComponent(`org:${ORG} is:pr is:merged`)}&type=pullrequests`,
};

export const nav = [['Projects', '/projects/'], ['Community', '/community/'], ['Research', '/research/']];

// Curated per-repo copy. Live GitHub data (stars, description, topics) is merged over it at build time.
const meta = {
  vajra: { name: 'Vajra', domain: 'Network Security', tagline: 'Inline intrusion prevention with automated response, built on Suricata.' },
  watchdog: { name: 'Watchdog', domain: 'Network Security', tagline: 'Guided, pentester-style network security assessment for Android, Windows and Linux.' },
  faceproof: { name: 'Faceproof', domain: 'AI/ML', tagline: 'Offline face verification and liveness for React Native. Biometric data never leaves the device.' },
  solstice: { name: 'Solstice', domain: 'Infrastructure', tagline: 'Carbon-aware suspension for stateful Apache Flink jobs on Kubernetes.' },
  adbt: { name: 'adbt', domain: 'Tooling', tagline: 'A modern, keyboard-driven Android Debug Bridge TUI.' },
};
const order = Object.keys(meta);

export function catalog(gh) {
  return gh.repos
    .filter((r) => meta[r.name])
    .map((r) => ({ ...r, slug: r.name, ...meta[r.name], url: `https://github.com/${ORG}/${r.name}` }))
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export const pillars = [
  { id: '01', title: 'Security Infrastructure', body: 'Inline intrusion prevention and pentester-style network assessment, designed to fail safe.', repos: ['vajra', 'watchdog'] },
  { id: '02', title: 'On-Device AI', body: 'Face verification and liveness that run offline. No cloud API, no per-call cost, and biometric data stays on the device.', repos: ['faceproof'] },
  { id: '03', title: 'Systems & Tooling', body: 'Developer tools and operators for the stack underneath: an ADB terminal UI, and carbon-aware suspension for Flink on Kubernetes.', repos: ['adbt', 'solstice'] },
  { id: '04', title: 'Core-Team Stewardship', body: 'Core members make the decisions that shape the foundation, and every repository has one or more of them assigned. Contributions are welcome from anyone, under Apache-2.0 unless a project says otherwise.', repos: [] },
];

export const flagship = {
  stages: [
    {
      n: 1, title: 'Inline capture', tag: 'iptables NFQUEUE → Suricata',
      body: 'Traffic is steered through an NFQUEUE and inspected by Suricata inline, so packets matching rules/local.rules are dropped before they reach the host.',
      log: ['$ sudo ./scripts/start.sh --dry-run', '[nfqueue] queue bound, suricata running inline', '[suricata] 203.0.113.7 → :80  rule matched  action=drop', '[suricata] alert written → logs/eve.json'],
    },
    {
      n: 2, title: 'Response engine', tag: 'SOAR decision',
      body: 'Every alert in eve.json is evaluated. Critical or high severity, a named attack class like SQL injection or scanning, or a confident ML flag means block. Loopback, host addresses, gateways and DNS resolvers are never blocked.',
      log: ['[soar] alert sev=1 sig="SQL injection attempt" src=203.0.113.7', '[soar] allowlist: not loopback / host / gateway / dns', '[soar] decision: BLOCK 203.0.113.7', '[soar] alert src=127.0.0.1 → never blocked (loopback)'],
    },
    {
      n: 3, title: 'Enforce & stream', tag: 'iptables / nftables · unified log',
      body: 'Blocks are applied with iptables or nftables. Each decision is logged, every block gets a report, and all events are available as one live WebSocket stream.',
      log: ['[soar] --dry-run: decision logged as not_enforced', '[soar] live mode: block applied via nftables', '[unified] logs/unified_events.json ← suricata + soar', '[stream] ws://127.0.0.1:8000/ws/logs  1 client'],
    },
  ],
  experimental: ['ML inference API', 'Scapy deep packet inspection', 'AI-generated Suricata rules', 'Federated learning'],
};

export const vajraCapabilities = [
  ['Inline IPS with custom Suricata rules', 'Implemented'],
  ['Automated IP blocking with allowlist and dry-run mode', 'Implemented'],
  ['Unified event log (Suricata, SOAR and ML)', 'Implemented'],
  ['Live event stream over WebSocket', 'Implemented'],
  ['Rule-based user behaviour analytics', 'Implemented'],
  ['Kafka export of alerts', 'Experimental'],
  ['ML model management and inference API', 'Experimental'],
  ['Scapy deep packet inspection', 'Experimental'],
  ['Encrypted-traffic, anomaly and fingerprinting engines', 'Experimental, not wired in'],
  ['AI-generated Suricata rules (Google Gemini)', 'Experimental, not wired in'],
  ['Federated learning (Flower)', 'Experimental, not wired in'],
  ['DPDK packet capture', 'Roadmap, does not build yet'],
];

export const vajraQuickstart = `git clone https://github.com/${ORG}/vajra.git
cd vajra
make install                         # Suricata and system packages
make setup                           # virtualenv and editable install
sudo ./scripts/start.sh --dry-run    # start without enforcing blocks`;
