// Per-project page content. Everything here is taken from each repository's README, docs/ and MAINTAINERS.md
// (github.com/Ergane-Foundation/<repo>); when a repo changes, update this file. Plain data only, so it can cross into
// client components.

export type Table = {
  title?: string;
  note?: string;
  head: string[];
  rows: string[][];
  /** Column holding a status; "Implemented…" / "Supported…" are highlighted. */
  statusCol?: number;
  /** Columns rendered as code (flags, field names, identifiers). */
  codeCols?: number[];
};
export type StageNode = { label: string; sub?: string; dashed?: boolean };
export type Stage = { title: string; tag: string; body: string; log: string[]; nodes?: StageNode[] };
export type Maintainer = { login: string; name: string; role: string };
export type Content = {
  /** One-line status banner under the title. */
  status?: string;
  overview: { paragraphs: string[]; highlights: [title: string, body: string][] };
  quickstart: { intro: string; blocks: { title?: string; code: string }[]; notes?: string[]; tables?: Table[] };
  how: { intro: string; termLabel: string; stages: Stage[]; experimental?: string[]; diagram?: 'vajra' };
  capabilities: { intro?: string; tables: Table[]; limits?: string[] };
  /** [label, repo file path or full URL, detail] */
  docs: [label: string, target: string, detail: string][];
  involved: {
    maintainers: Maintainer[];
    decisions?: string;
    roadmap?: string[];
    checks?: { title: string; code: string };
  };
};

// ── Vajra ────────────────────────────────────────────────────────────────────────────────────────────────────────
const vajra: Content = {
  status: 'Early stage · not yet released · nothing has run in production · ML components are experimental',
  overview: {
    paragraphs: [
      'Vajra runs Suricata inline, so packets matching its rules are dropped before they reach the host. Alongside it, a response engine reads every alert, decides whether the source should be blocked outright, and applies the block with iptables or nftables. Each decision is logged, every block gets a report, and all events are available as one live stream.',
      'The rule the whole thing is built around: Vajra never cuts the host off from its own network. Loopback, every address on the host, its IPv4 and IPv6 default gateways and its DNS resolvers are never blocked.',
    ],
    highlights: [
      ['Inline, not passive', 'Suricata runs inline through an NFQUEUE, so packets that match its rules are dropped before they reach the host.'],
      ['Automated response', 'The response engine blocks sources that raise critical or high severity alerts or name an attack class such as SQL injection or scanning, and logs every decision.'],
      ['One hard rule', 'Vajra never cuts the host off from its own network: loopback, host addresses, default gateways and DNS resolvers are never blocked.'],
    ],
  },
  quickstart: {
    intro: 'Use a disposable Linux VM (Ubuntu or Debian) with Python 3.10+, root access and make. Live mode inserts NFQUEUE rules and enables IPv4 forwarding.',
    blocks: [
      {
        code: `git clone https://github.com/Ergane-Foundation/vajra.git
cd vajra
make install                         # Suricata and system packages
make setup                           # virtualenv and editable install
sudo ./scripts/start.sh --dry-run    # start without enforcing blocks`,
      },
      {
        title: 'Send some attack traffic, then look at what Vajra decided',
        code: `python3 tools/attack_simulator.py --target <vm-ip>   # from another machine
make status
tail -f logs/soar_actions.log`,
      },
      {
        title: 'When the decisions look right, enforce them',
        code: `sudo ./scripts/start.sh    # restart without --dry-run
make stop                  # stop everything`,
      },
      {
        title: 'Or replay a saved eve.json without root',
        code: 'python -m vajra.soar.engine --file-mode --eve path/to/eve.json --dry-run --allow 10.0.0.0/8',
      },
    ],
    notes: ['On macOS, install Suricata with Homebrew (brew install suricata), then run make setup and make start. Suricata runs in passive mode there, so Vajra detects but cannot block.'],
    tables: [
      {
        title: 'Options for scripts/start.sh and scripts/start_macos.sh',
        head: ['Option', 'Description'],
        codeCols: [0],
        rows: [
          ['--dry-run', 'Log SOAR block decisions without changing the firewall'],
          ['--no-http', 'Do not start the demo HTTP target'],
          ['--no-api', 'Do not start the inference API'],
        ],
      },
      {
        title: 'Environment variables',
        head: ['Variable', 'Default', 'Description'],
        codeCols: [0],
        rows: [
          ['VAJRA_INTERFACE', 'auto-detected', 'Network interface to protect'],
          ['VAJRA_ALLOWLIST', '—', 'Comma separated addresses or networks that are never blocked'],
          ['VAJRA_API_HOST', '127.0.0.1', 'Address the event stream and inference API bind to'],
          ['HTTP_PORT', '80 (8080 on macOS)', 'Port for the demo HTTP target'],
          ['ML_MODELS_DIR', 'models', 'Directory the SOAR engine loads models from'],
        ],
      },
      {
        title: 'Services and ports',
        head: ['Service', 'Port', 'Started by default'],
        rows: [
          ['Suricata (NFQUEUE 0)', '—', 'yes'],
          ['Event stream', '8000', 'yes'],
          ['Inference API', '8001', 'yes, --no-api to skip'],
          ['Demo HTTP target', '80 (8080 on macOS)', 'yes, --no-http to skip'],
          ['Kafka bridge to localhost:9092', '—', 'yes, idle unless Kafka is running'],
        ],
        note: 'The endpoints are described in docs/api-reference.md.',
      },
      {
        title: 'Optional features (Python extras)',
        head: ['Extra', 'Adds'],
        codeCols: [0],
        rows: [
          ['ml', 'TensorFlow, PyTorch and imbalanced-learn for the bundled models'],
          ['dpi', 'Scapy packet inspection'],
          ['fl', 'Flower for federated learning'],
          ['rulegen', 'Google Gemini client for AI rule generation'],
          ['perf', 'Matplotlib and psutil for the performance harnesses'],
        ],
        note: 'The core install is kept small. Install one with pip install -e ".[ml]", or all of them with make setup-full. What is known about each bundled model is in models/README.md.',
      },
      {
        title: 'Repository layout',
        head: ['Path', 'What it holds'],
        codeCols: [0],
        rows: [
          ['src/vajra/soar/', 'Response engine: alert, decision, firewall block, reports'],
          ['src/vajra/pipeline/', 'eve.json consumers: event stream, unified logger, Kafka bridge'],
          ['src/vajra/detection/', 'Behaviour analytics used by the SOAR engine'],
          ['src/vajra/ml/', 'Model loading and prediction management'],
          ['src/vajra/inspection/', 'Packet inspection (Scapy, DPDK feature feed)'],
          ['src/vajra/api/', 'Inference API and its client'],
          ['src/vajra/experimental/', 'Engines, AI rule generation, federated learning'],
          ['rules/ · config/suricata/', 'Suricata rules and configuration'],
          ['models/', 'Bundled model files'],
          ['scripts/', 'Install, start, stop, status and diagnostics'],
          ['native/dpdk/', 'DPDK packet processor (C++)'],
          ['tests/perf/ · tools/', 'Load test harnesses; attack simulator, live monitor, WebSocket client, benchmark'],
        ],
      },
    ],
  },
  how: {
    intro: 'Suricata inspects traffic from an NFQUEUE and writes its events to logs/eve.json. Each Python service tails that file on its own. Select a stage to highlight it in the pipeline.',
    termLabel: 'simulated output · documentation addresses',
    diagram: 'vajra',
    experimental: ['ML inference API', 'Scapy deep packet inspection', 'AI-generated Suricata rules', 'Federated learning'],
    stages: [
      {
        title: 'Inline capture', tag: 'iptables NFQUEUE → Suricata',
        body: 'Traffic is steered through an NFQUEUE and inspected by Suricata inline, so packets matching rules/local.rules are dropped before they reach the host.',
        log: ['$ sudo ./scripts/start.sh --dry-run', '[nfqueue] queue bound, suricata running inline', '[suricata] 203.0.113.7 → :80  rule matched  action=drop', '[suricata] alert written → logs/eve.json'],
      },
      {
        title: 'Response engine', tag: 'SOAR decision',
        body: 'Every alert in eve.json is evaluated. Critical or high severity, a named attack class like SQL injection or scanning, or a confident ML flag means block. Loopback, host addresses, gateways and DNS resolvers are never blocked.',
        log: ['[soar] alert sev=1 sig="SQL injection attempt" src=203.0.113.7', '[soar] allowlist: not loopback / host / gateway / dns', '[soar] decision: BLOCK 203.0.113.7', '[soar] alert src=127.0.0.1 → never blocked (loopback)'],
      },
      {
        title: 'Enforce & stream', tag: 'iptables / nftables · unified log',
        body: 'Blocks are applied with iptables or nftables. Each decision is logged, every block gets a report, and all events are available as one live WebSocket stream.',
        log: ['[soar] --dry-run: decision logged as not_enforced', '[soar] live mode: block applied via nftables', '[unified] logs/unified_events.json ← suricata + soar', '[stream] ws://127.0.0.1:8000/ws/logs  1 client'],
      },
    ],
  },
  capabilities: {
    intro: 'As reported in the project README.',
    tables: [
      {
        title: 'Status of each capability',
        head: ['Capability', 'Status'],
        statusCol: 1,
        rows: [
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
        ],
      },
      {
        title: 'Safety: what Vajra will never block',
        head: ['Situation', 'What Vajra does'],
        rows: [
          ['Alert source is loopback, any address on the host, its IPv4 or IPv6 default gateways or a DNS resolver', 'Never blocks it'],
          ['Alert source is in --allow or VAJRA_ALLOWLIST', 'Never blocks it'],
          ['Connection started by any of those addresses', 'Suricata passes it without inspection, so no rule drops it'],
          ['Started with --dry-run', 'Logs each decision as not_enforced and leaves the firewall alone'],
          ['No firewall backend, for example on macOS', 'Logs the decision as not_enforced rather than reporting a block'],
          ['Event stream and inference API', 'Listen on 127.0.0.1 only, unless VAJRA_API_HOST says otherwise'],
          ['Demo HTTP target', 'Serves only logs/www, never the repository'],
        ],
      },
    ],
    limits: [
      'Blocks never expire. They last until scripts/stop.sh removes the inet vajra table or, with iptables, the VAJRA-BLOCK chain, and the SOAR engine re-applies the ones in logs/blocked_ips.txt when it starts again.',
      'Blocks only apply to traffic to and from the host itself. The nftables chains hook input and output, and the iptables VAJRA-BLOCK chain is only jumped to from INPUT and OUTPUT, so traffic forwarded through the host is not dropped when Vajra runs inline.',
      'One matching alert is enough to block a source. There is no threshold, cooldown or rate limit yet.',
      'The bundled models have no documented training data or evaluation, and some are fed inputs that do not match what they were trained on.',
      'If the gateway NATs inbound traffic, connections forwarded through it look like the gateway and are not inspected either.',
      'Live mode runs every component as root, inserts NFQUEUE rules for IPv4 and IPv6 and enables IPv4 forwarding. IPv6 forwarding stays off, because enabling it can drop the host’s IPv6 default route. Use a disposable Linux VM.',
      'logs/eve.json and logs/unified_events.json grow without rotation.',
      'There is no automated test suite yet.',
    ],
  },
  docs: [
    ['README', 'README.md', 'Overview, status, configuration, limitations and roadmap'],
    ['Architecture', 'docs/architecture.md', 'How the pipeline and the response engine fit together'],
    ['API reference', 'docs/api-reference.md', 'Endpoints of the event stream and the inference API'],
    ['Bundled models', 'models/README.md', 'What is known about each bundled model'],
    ['Contributing', 'CONTRIBUTING.md', 'How to contribute'],
    ['Security policy', 'SECURITY.md', 'Report a vulnerability privately'],
    ['Code of conduct', 'CODE_OF_CONDUCT.md', 'How we treat each other'],
  ],
  involved: {
    maintainers: [
      { login: 'NamanmeetSingh', name: 'Namanmeet Singh', role: 'Lead Maintainer' },
      { login: 'agam1092005', name: 'Agampreet Singh', role: 'Lead Maintainer' },
    ],
    roadmap: [
      'Expiring blocks and an unblock command',
      'Thresholds, cooldowns and rate limits on blocking',
      'An offline demo with Docker Compose and pcap replay that needs no root',
      'Validated models with documented training data',
      'A dashboard',
      'The DPDK capture path',
    ],
    checks: { title: 'Set up a dev environment and lint before you open a pull request', code: 'make setup\nsource venv/bin/activate\nmake lint' },
  },
};

// ── Watchdog ─────────────────────────────────────────────────────────────────────────────────────────────────────
const watchdog: Content = {
  status: 'Non-root MVP · you can only scan the network you are joined to · debug-signed APK for sideloading',
  overview: {
    paragraphs: [
      'A guided, pentester-style network security assessment tool for Android, Windows and Linux, with an optional correlation backend. It walks you through discovering the network, discovering hosts, enumerating services, fingerprinting, correlating against vulnerability intelligence, prioritizing, you deciding, and safe verification.',
      'Core principle: automate the repetitive work, keep the human in control of important decisions.',
    ],
    highlights: [
      ['Hands and brain', 'The phone or desktop app does 100% of network I/O. The backend never connects to a target, so server-side request forgery is impossible by construction.'],
      ['One engine, three platforms', 'Scanning and correlation live once in a pure Kotlin core module and run unchanged on Android, Windows and Linux. Only the platform edges differ.'],
      ['Honest confidence', 'Findings carry explicit states, DETECTED → LIKELY_VULNERABLE → VERIFIED → EXPLOITABLE, and distro backport suppression stops version-only matches from being over-reported.'],
    ],
  },
  quickstart: {
    intro: 'The desktop app (Windows and Linux) and the correlation backend run from source today. For the Android app, open the android/ folder in Android Studio, or sideload the APK from a tagged release.',
    blocks: [
      {
        title: 'Desktop app',
        code: `git clone https://github.com/Ergane-Foundation/watchdog.git
cd watchdog/android
gradle :desktop:run                                  # launch the desktop GUI
gradle :desktop:runHeadless                          # CLI scan of the current subnet
gradle :desktop:runHeadless --args="--list"          # list scannable adapters
gradle :desktop:runHeadless --args="--iface=wlan0 --correlate"   # pick an adapter and correlate`,
      },
      {
        title: 'Correlation backend',
        code: `cd backend
npm install
npm test              # node --test over the golden-set + version-comparator suites
npm run typecheck`,
      },
    ],
    notes: [
      'Android: AGP 8.7, Gradle 8.10.2, Kotlin 2.0, JDK 17, minSdk 26, compileSdk 35. On first sync Android Studio generates the Gradle wrapper jar (not committed).',
      'Backend: Node 23.6 or newer, using native TypeScript type-stripping (no build step).',
      'Tagged releases attach an installable APK and a portable desktop zip for Windows and Linux. The APK is debug-signed, which suits sideloading, the intended way to distribute this tool.',
    ],
  },
  how: {
    intro: 'A scan is iterative and user-driven: Networks → Discovering → SelectDevices → ChoosePorts → Scanning → Results → DeviceDetail. Select a stage to see what runs where. The client does every bit of network I/O; the backend is only a brain.',
    termLabel: 'commands and notes from the README and docs',
    stages: [
      {
        title: 'Discover', tag: 'client · network and hosts',
        body: 'Shows the joined network as scannable, then merges TCP-connect probing, best-effort ICMP and mDNS into a live host list. No port scan happens yet.',
        nodes: [{ label: 'NETWORK CONTEXT', sub: 'SSID + subnet' }, { label: 'HOST DISCOVERY', sub: 'TCP · ICMP · mDNS' }, { label: 'SELECT TARGETS', sub: 'whole network or host' }],
        log: ['$ gradle :desktop:runHeadless --args="--list"', '# lists scannable adapters on desktop', '# Discovering: TCP-connect probing, best-effort ICMP and mDNS', '#   merged into a live host list'],
      },
      {
        title: 'Enumerate & fingerprint', tag: 'client · ports and services',
        body: 'A bounded-concurrency connect scan (Top 100, Top 1000 or all ports), then banner, HTTP and TLS-certificate probes, normalized to product, version and distro.',
        nodes: [{ label: 'PORT SCAN', sub: 'Top 100 · 1000 · all' }, { label: 'PROBES', sub: 'banner · HTTP · TLS' }, { label: 'FINGERPRINT', sub: 'product·version·distro' }],
        log: ['# Scope: whole network or one host', '# Depth: Top-100 / Top-1000 / All ports', '# bounded-concurrency connect scan, then banner / HTTP / TLS-cert probes', '# → normalized {product, version, distro}'],
      },
      {
        title: 'Correlate', tag: 'engine · OSV, KEV, EPSS',
        body: 'On-device by default against OSV.dev, CISA KEV and EPSS, through a Kotlin port of the backend engine. Or point the app at your own backend, which correlates but never touches a target.',
        nodes: [{ label: 'OSV · KEV · EPSS', sub: 'on-device default' }, { label: 'CORRELATION ENGINE', sub: 'Kotlin port of backend' }, { label: 'RANKED FINDINGS', sub: 'explicit confidence' }],
        log: ['$ gradle :desktop:runHeadless --args="--iface=wlan0 --correlate"', '# OSV.dev + CISA KEV + EPSS on-device, or POST to your own backend', '# DETECTED → LIKELY_VULNERABLE → VERIFIED → EXPLOITABLE'],
      },
      {
        title: 'Decide & verify', tag: 'you stay in control',
        body: 'Results are device-centric. Vulnerability checks run on demand and their findings are added below the device details, never replacing them. Verification uses signed check definitions that the phone runs locally.',
        nodes: [{ label: 'RESULTS', sub: 'per device' }, { label: 'YOU DECIDE', sub: 'human in control' }, { label: 'SAFE VERIFICATION', sub: 'signed checks, run locally' }],
        log: ['# DeviceDetail: services and raw fingerprints', '# findings are added below the device details, never replacing them', '$ cd backend && npm test    # golden-set + version-comparator suites'],
      },
    ],
  },
  capabilities: {
    intro: 'What the apps do today, and where. Android needs no root.',
    tables: [
      {
        title: 'What the apps do',
        head: ['Capability', 'Where'],
        rows: [
          ['Network discovery of the joined network', 'Android · Windows · Linux'],
          ['Host discovery: TCP connect, best-effort ICMP, mDNS', 'Android · Windows · Linux'],
          ['Port enumeration: Top 100, Top 1000 or all ports', 'Android · Windows · Linux'],
          ['Fingerprinting: banner, HTTP and TLS-certificate probes', 'Android · Windows · Linux'],
          ['CVE correlation against OSV.dev, CISA KEV and EPSS, on-device or via your own backend', 'Android · Windows · Linux'],
          ['Scan history: reopen, export or delete past scans', 'Android · Windows · Linux'],
          ['WPA handshake tool: import, submit to WPA-sec, track cracked results', 'Android · Windows · Linux'],
          ['Background scans with a foreground service and notifications', 'Android'],
          ['Nearby access point list', 'Android'],
          ['Adapter picker for Wi-Fi plus Ethernet or a second USB dongle', 'Windows · Linux'],
          ['Live WPA handshake capture', 'Android only (USB adapter or root)'],
          ['SYN, ARP, MAC and OS detection', 'Future root tier, not built'],
        ],
      },
      {
        title: 'How the correlation engine avoids false positives',
        head: ['Defence', 'What it does'],
        rows: [
          ['CVE-List-first, not NVD-first', 'NVD stopped enriching most CVEs in 2026.'],
          ['Distro backport suppression', 'A real dpkg version comparator, so OpenSSH_8.2p1 Ubuntu-4ubuntu0.11 is judged patched by the distro even though upstream 8.2p1 looks vulnerable.'],
          ['Version-only matches', 'Never rank above LIKELY_VULNERABLE.'],
          ['CVSS by provenance', 'v4 over v3.1, CNA over NVD, never averaged.'],
          ['KEV and EPSS', 'Drive prioritization so range-match noise does not drown the signal.'],
        ],
      },
    ],
    limits: [
      'You can only scan the network you are joined to. Android gives no layer-3 route to a network you have not joined.',
      'Bare upstream products (no distro tag) get lower-confidence OSV matches until own-server mode points at an NVD-CPE index.',
      'The backend and the Kotlin engine are two ports of one design, validated against the same golden set. A change to one must land in the other.',
      'The desktop app links to GitHub releases but does not update itself.',
    ],
  },
  docs: [
    ['README', 'README.md', 'Overview, repository layout, platform notes'],
    ['Architecture', 'docs/architecture.md', 'Hands and brain, platform seams, the scan flow'],
    ['Changelog', 'CHANGELOG.md', 'What changed in each release'],
    ['Contributing', 'CONTRIBUTING.md', 'How to contribute'],
    ['Maintainers', 'MAINTAINERS.md', 'Who maintains it and how decisions are made'],
    ['Security policy', 'SECURITY.md', 'Report a vulnerability privately'],
    ['Support', 'SUPPORT.md', 'Where to ask questions'],
    ['Code of conduct', 'CODE_OF_CONDUCT.md', 'How we treat each other'],
    ['Releases', 'releases', 'APK and desktop builds'],
  ],
  involved: {
    maintainers: [{ login: 'ShreyasMahajann', name: 'Shreyas Mahajan', role: 'Lead maintainer' }],
    decisions: 'Small changes are decided in the pull request. Larger changes (new tools, new platforms, new dependencies, changes to correlation semantics) start as an issue so others can comment; the lead maintainer makes the final call and records the reason in the issue. Contributors who make several solid pull requests and help others in reviews may be invited to become maintainers.',
    checks: { title: 'Run the tests before you open a pull request', code: `cd backend && npm test && npm run typecheck\ncd android && gradle testDebugUnitTest    # JVM unit tests, run against the same golden set` },
  },
};

// ── Faceproof ────────────────────────────────────────────────────────────────────────────────────────────────────
const faceproof: Content = {
  status: 'Pre-release · not yet published to npm · Android supported, iOS experimental',
  overview: {
    paragraphs: [
      'Open-source offline face verification and liveness SDK for React Native. No cloud API, no per-call cost, and biometric data never leaves the device.',
      'Made for places with weak or no internet: attendance at remote field sites or schools with poor connectivity, event and kiosk check-in, hostel or site entry, and agent verification for cooperatives.',
    ],
    highlights: [
      ['Everything on the device', 'The SDK makes no network calls and never stores images. Uploading attendance records is the app’s decision.'],
      ['Active liveness', 'Two random challenges out of blink, smile and head turn. It is designed to stop static photos; it does not defend against video replay, deepfakes or masks.'],
      ['Encrypted by default', 'Templates and the attendance queue live in a SQLCipher (AES-256) database, with keys protected by the Android Keystore.'],
    ],
  },
  quickstart: {
    intro: 'The fastest way to see it working is the example app on an Android phone. Requirements: Node 24, Yarn (via Corepack), JDK 17 and the Android SDK with platform 36.',
    blocks: [
      {
        code: `git clone https://github.com/Ergane-Foundation/faceproof.git
cd faceproof
yarn install
yarn setup            # download and verify the models, create a debug keystore
yarn example android  # with a phone connected over USB`,
      },
      {
        title: 'Using the SDK',
        code: `import { BiometricSDK, createLivenessState, pickChallenges, updateLiveness } from 'faceproof';

await BiometricSDK.initialize();                                   // once, at app start
await BiometricSDK.enrollWorker('EMP-1042', [frame1, frame2, frame3], faceBox);

const random = await BiometricSDK.createSecureRandomInt();
let session = createLivenessState(pickChallenges(2, random), {}, Date.now());
session = updateLiveness(session, observation);                    // one per camera frame

// after session.status === 'PASSED', take a photo and verify
const result = await BiometricSDK.verifyWorker(photoBase64, faceBox);
// { status: 'MATCH', workerId: 'EMP-1042', confidence: 0.82, inferenceMs, totalMs, quality }
if (result.status === 'MATCH') await BiometricSDK.logAttendance(result.workerId!, result.confidence!);`,
      },
    ],
    notes: [
      'verifyWorker returns MATCH, NO_MATCH, NO_FACE, MULTIPLE_FACES or POOR_QUALITY. Errors reject with stable codes listed in docs/ARCHITECTURE.md.',
      'Verify in even light from the front. In dim light most photos fail the quality check (POOR_QUALITY).',
      'Pass the face box from your camera’s face detector (for example ML Kit) when you have one. On Android it selects which face to use and made verification faster in the maintainers’ test (median 147 ms against 237 ms without a box).',
      'Read docs/MODELS.md before production use: it explains where the embedding model comes from and why its training data is a concern.',
    ],
    tables: [
      {
        title: 'Models (downloaded by yarn setup:models, checked against a fixed SHA-256)',
        head: ['File', 'Purpose', 'Size', 'License'],
        codeCols: [0],
        rows: [
          ['blazeface.tflite', 'Face detection and keypoints', '0.22 MB', 'Apache-2.0'],
          ['mobilefacenet.tflite', 'Face embedding', '5.0 MB', 'BSD-3-Clause (source repository)'],
        ],
      },
      {
        title: 'Configuration',
        head: ['Option', 'Default', 'Meaning'],
        codeCols: [0],
        rows: [
          ['initialize({ matchThreshold })', '0.54', 'Minimum cosine similarity for a match. Chosen for a false accept rate of 1e-4 per comparison on LFW.'],
          ['initialize({ minQuality })', '0.5', 'Minimum blur and exposure score before matching (Android).'],
          ['createLivenessState(challenges, config)', 'DEFAULT_LIVENESS_CONFIG', 'Timeout and detector thresholds for liveness.'],
        ],
      },
    ],
  },
  how: {
    intro: 'On Android, each photo is decoded in memory, checked for blur and exposure, and searched for faces with BlazeFace. The face is aligned, embedded with MobileFaceNet and compared with every stored template. Select a stage; the snippets are from the README.',
    termLabel: 'snippets from the README and docs',
    stages: [
      {
        title: 'Liveness', tag: 'JavaScript · pure functions',
        body: 'Two of three challenges (blink, smile, head turn) in random order. Every challenge starts from the opposite pose, so a still photo cannot pass. More than one face fails the session; the whole session times out after 12 seconds by default.',
        nodes: [{ label: 'CAMERA FRAMES', sub: 'face detector signals' }, { label: 'CHALLENGES', sub: '2 of blink·smile·turn' }, { label: 'SESSION PASSED', sub: '12 s timeout' }],
        log: ['const random = await BiometricSDK.createSecureRandomInt();', 'let session = createLivenessState(pickChallenges(2, random), {}, Date.now());', 'session = updateLiveness(session, observation);  // one per camera frame', '// verification photo is taken after session.status === \'PASSED\''],
      },
      {
        title: 'Detect & align', tag: 'Android · BlazeFace',
        body: 'The photo is decoded in memory and scored for blur and exposure. BlazeFace finds the face and six keypoints, and a similarity transform maps eyes, nose and mouth onto fixed template positions. On a subset of LFW, alignment took accuracy from about 78% to about 99%.',
        nodes: [{ label: 'PHOTO', sub: 'decoded in memory' }, { label: 'QUALITY GATE', sub: 'blur · exposure ≥ 0.5' }, { label: 'BLAZEFACE', sub: 'box + 6 keypoints' }, { label: 'ALIGNMENT', sub: 'eyes · nose · mouth' }],
        log: ['// decoded in memory, recycled after use: images never touch disk', '// quality = sharpness (Laplacian variance) + exposure, on a 256x256 copy', '// BlazeFace on a letterboxed 128x128 input: boxes + 6 keypoints', '// least-squares similarity transform → 112x112 template positions'],
      },
      {
        title: 'Embed & match', tag: 'MobileFaceNet · 1:N',
        body: 'MobileFaceNet turns the aligned face into a 192-value embedding, compared by cosine similarity with every enrolled template. At the default threshold of 0.54 the false accept rate is 8.0e-5 per comparison on LFW.',
        nodes: [{ label: 'MOBILEFACENET', sub: '192-value embedding' }, { label: 'COSINE MATCH', sub: 'threshold 0.54' }, { label: 'RESULT', sub: 'MATCH · NO_MATCH · …' }],
        log: ['const result = await BiometricSDK.verifyWorker(photoBase64, faceBox);', '// { status: \'MATCH\', workerId: \'EMP-1042\', confidence: 0.82,', '//   inferenceMs, totalMs, quality }', '// MATCH · NO_MATCH · NO_FACE · MULTIPLE_FACES · POOR_QUALITY'],
      },
      {
        title: 'Log & sync', tag: 'offline queue · optional backend',
        body: 'Each attendance record is signed with HMAC-SHA256 and queued in the encrypted database. Uploading is your app’s choice, for example to the reference AWS SAM backend, which expires stored records after 90 days.',
        nodes: [{ label: 'SIGNED RECORD', sub: 'HMAC-SHA256' }, { label: 'ENCRYPTED QUEUE', sub: 'SQLCipher · Keystore' }, { label: 'YOUR BACKEND', sub: 'optional AWS SAM stack', dashed: true }],
        log: ['await BiometricSDK.logAttendance(result.workerId!, result.confidence!);', 'const pending = await BiometricSDK.getPendingRecords();', '// upload to your backend, then:', 'await BiometricSDK.markSynced(pending.map((r) => r.id));'],
      },
    ],
  },
  capabilities: {
    intro: 'Measured on one Android phone so far; the maintainers say plainly what is not yet verified.',
    tables: [
      {
        title: 'Platforms',
        head: ['Platform', 'Status'],
        statusCol: 1,
        rows: [
          ['Android', 'Supported (API 24+). Enrollment, verification, encryption and photo cleanup checked on one physical device; impostor rejection and liveness against spoofs not yet verified on a device.'],
          ['iOS', 'Experimental. Compiles in CI but is not tested on a device, and needs a Core ML model that is not included.'],
        ],
      },
      {
        title: 'Features',
        head: ['Feature', 'Status'],
        statusCol: 1,
        rows: [
          ['On-device face detection and alignment with BlazeFace', 'Implemented on Android'],
          ['Face embedding with MobileFaceNet and 1:N matching against everyone enrolled', 'Implemented'],
          ['Active liveness: challenge-response, two random challenges', 'Implemented; not yet verified against spoofs on a device'],
          ['Encrypted storage: SQLCipher (AES-256), keys in the Android Keystore', 'Implemented'],
          ['Offline attendance queue: signed records, optional location, optional self-hosted sync backend for AWS', 'Implemented'],
          ['No images stored or logged by the SDK', 'Implemented'],
          ['Passive anti-spoofing to complement active liveness', 'Roadmap'],
        ],
      },
      {
        title: 'Speed on a phone (0.2.0, release build, Samsung Galaxy A17, one person, small sample)',
        head: ['Light', 'ML Kit box', 'Result', 'Median model time', 'Median total'],
        rows: [
          ['Even front light', 'on', '5 of 5 MATCH', '29 ms', '147 ms'],
          ['Even front light', 'off', '4 of 5 MATCH', '48 ms', '237 ms'],
          ['Dim indoor', 'on', '2 of 10 MATCH', '—', '—'],
        ],
        note: 'Dim light fails the quality gate before matching. Accuracy on LFW, likely an upper bound: 99.28% 10-fold accuracy; at the default threshold, FAR 8.0e-5 per comparison and TAR 92.97%. Method and caveats are in docs/BENCHMARKS.md.',
      },
      {
        title: '1:N risk: every verification is compared with everyone enrolled',
        head: ['People enrolled', 'Chance of a false match (threshold 0.54, LFW)'],
        rows: [['10', '0.08%'], ['100', '0.8%'], ['1,000', '7.7%']],
        note: 'For large groups, raise the threshold or split people into smaller groups.',
      },
    ],
    limits: [
      'Templates are still biometric data. You remain responsible for consent and retention.',
      'iOS and Android templates are not comparable: Android aligns each face before embedding it, iOS does not yet. Do not enroll on one platform and verify on the other.',
      'The match threshold is calibrated on LFW, which is likely an upper bound because its photos are clean and the model’s training data overlaps LFW identities.',
      'The example app’s face detector is Google ML Kit, which keeps a local queue of usage logs and sends them to Google when the phone is online. See docs/PRIVACY.md.',
    ],
  },
  docs: [
    ['README', 'README.md', 'Overview, quick start, usage, benchmarks'],
    ['Architecture', 'docs/ARCHITECTURE.md', 'JS layer, Android pipeline, storage, signed records, error codes'],
    ['Benchmarks', 'docs/BENCHMARKS.md', 'Method, numbers and caveats'],
    ['Models', 'docs/MODELS.md', 'Where the models come from and the training-data concern'],
    ['Privacy', 'docs/PRIVACY.md', 'Notes for app developers (not legal advice)'],
    ['Security model', 'docs/SECURITY_MODEL.md', 'What is protected, and the limits'],
    ['Changelog', 'CHANGELOG.md', 'What changed in each release'],
    ['Contributing', 'CONTRIBUTING.md', 'How to contribute'],
    ['Maintainers', 'MAINTAINERS.md', 'Who maintains it and how decisions are made'],
    ['Security policy', 'SECURITY.md', 'Report a vulnerability privately'],
    ['Third-party notices', 'THIRD_PARTY_NOTICES.md', 'Components and the separately downloaded models'],
  ],
  involved: {
    maintainers: [{ login: 'DhruvGoyal404', name: 'Dhruv Goyal', role: 'Lead maintainer' }],
    decisions: 'Small changes are decided in the pull request. Larger changes (new features, breaking API changes, a different model) start as an issue or discussion so others can comment; the lead maintainer makes the final call and records the reason in the issue. Contributors who make several solid pull requests and help others in reviews may be invited to become maintainers.',
    roadmap: [
      'Validate the match threshold on field-like data (phones, outdoor light, diverse faces)',
      'Measure speed on a range of Android phones',
      'Make iOS work: embedding model and face alignment, tested on a device',
      'Replace the embedding model with one trained on consented data',
      'Passive anti-spoofing to complement the active liveness check',
      'Server-side signature verification with per-device keys',
      'First npm release',
    ],
  },
};

// ── Solstice ─────────────────────────────────────────────────────────────────────────────────────────────────────
const solstice: Content = {
  status: 'Early stage · not yet released · nothing has run in production · expect the custom resource and configuration to change',
  overview: {
    paragraphs: [
      'Carbon-aware suspension for stateful Apache Flink clusters. Solstice watches the carbon intensity of the grid powering your cluster. When the grid turns dirty it suspends the Flink job, and when the grid comes back clean it resumes the job from the savepoint taken on the way down. The job picks up where it left off rather than starting over.',
      'The rule the whole thing is built around: a job is never suspended unless its state is captured first, and never resumed from anything but its own savepoint.',
    ],
    highlights: [
      ['State first', 'Stopping a stream processor carelessly throws away in-flight windowed state and breaks exactly-once processing. Solstice suspends only with a savepoint, and resumes only from that job’s own.'],
      ['Through the Flink operator', 'It patches FlinkDeployment.spec.job.state rather than scaling the Deployment, because the Flink Kubernetes Operator owns that Deployment and would undo any replica change made behind its back.'],
      ['Fails safe', 'If telemetry is unreachable, erroring or stale, Solstice holds every job where it is, neither suspending nor resuming.'],
    ],
  },
  quickstart: {
    intro: 'You need Docker with at least 6 GB of memory, Minikube, kubectl, Helm, Java 17, Maven and make. The first run takes around 20 minutes, mostly downloading images.',
    blocks: [
      {
        code: `git clone https://github.com/Ergane-Foundation/solstice.git
cd solstice
make up`,
      },
      {
        title: 'Drive the grid by hand (the telemetry service simulates it without an Electricity Maps token)',
        code: `make demo-dirty
make demo-clean
kubectl get solsticecontrollers -n solstice`,
      },
      {
        title: 'Install with Helm',
        code: 'helm install solstice ./charts/solstice --namespace solstice --create-namespace',
      },
    ],
    notes: [
      'make up creates a Minikube profile called solstice, builds the images, installs cert-manager and the Flink Kubernetes Operator, deploys SeaweedFS as the S3 store, the Solstice operator, the telemetry service, a sample Flink job, Prometheus and Grafana, and finishes with a smoke test.',
      'The Helm chart expects the Flink Kubernetes Operator, an S3 store and your FlinkDeployments to exist already. Images are not published yet, so build solstice/operator:latest and solstice/telemetry:latest into your cluster first, as make up does.',
      'Each managed FlinkDeployment must set spec.job.upgradeMode: savepoint.',
      'make help lists the other targets; make status shows the Flink job and the pods.',
    ],
    tables: [
      {
        title: 'SolsticeController fields (main ones; the non-cooperative-mode fields are in the README)',
        head: ['Field', 'Default', 'Description'],
        codeCols: [0],
        rows: [
          ['carbonThreshold', '400', 'gCO2/kWh above which the grid counts as dirty'],
          ['cooperativeSuspension', 'true', 'Suspend through the FlinkDeployment rather than by scaling'],
          ['nodePowerWatts', '250', 'Assumed draw of the freed capacity, used for the carbon estimate'],
          ['flinkJobName / flinkNamespace', '—', 'The FlinkDeployment to manage, and its namespace'],
          ['jobSelector', '—', 'Labels selecting the FlinkDeployments to manage, instead of one name'],
          ['telemetryEndpoint / forecastEndpoint', '—', 'Where to read carbon intensity and the carbon forecast'],
          ['schedulingPolicy', 'threshold', 'threshold, forecast or optimising'],
          ['costPredictor', 'static', 'static, observed or regression'],
          ['breakEvenMultiplier', '2.0', 'How much longer than the round trip a window must be'],
          ['maxConcurrentSuspensions', '0', 'How many jobs may be suspended together, 0 for no limit'],
        ],
      },
    ],
  },
  how: {
    intro: 'The operator reconciles every 60 seconds. On a dirty grid it patches FlinkDeployment.spec.job.state to suspended, and the Flink Kubernetes Operator takes a savepoint before stopping the job. On a clean grid it writes that job’s savepoint into spec.job.initialSavepointPath and sets the state back to running.',
    termLabel: 'output from the README demo',
    stages: [
      {
        title: 'Read the grid', tag: 'telemetry · Electricity Maps',
        body: 'The telemetry service reads carbon intensity from Electricity Maps, or runs simulated without a token. A reading older than STALE_AFTER_SECONDS (default 600) is reported as UNKNOWN, and the operator holds every job until fresh data arrives.',
        nodes: [{ label: 'ELECTRICITY MAPS', sub: 'or simulated mode' }, { label: 'TELEMETRY', sub: 'stale → UNKNOWN' }, { label: 'OPERATOR', sub: 'reconciles every 60 s' }],
        log: ['$ make demo-dirty', '[demo] Grid set to dirty', '# a reading older than STALE_AFTER_SECONDS (600) is UNKNOWN', '# → the operator holds every job until fresh data arrives'],
      },
      {
        title: 'Decide', tag: 'scheduling policy',
        body: 'Above carbonThreshold the grid counts as dirty. The threshold policy suspends whenever it is dirty; forecast declines windows too short to pay for the savepoint and restart; optimising also ranks jobs when more want suspending than maxConcurrentSuspensions allows.',
        nodes: [{ label: 'CARBON INTENSITY', sub: 'vs threshold 400' }, { label: 'POLICY', sub: 'threshold·forecast·optim.' }, { label: 'SUSPEND / RESUME', sub: 'or hold' }],
        log: ['$ kubectl get solsticecontrollers -n solstice', 'NAME                        GRID    CARBON   ACTION              SAVEPOINT   JOBS   AGE', 'solstice-flink-controller   DIRTY   850      ALREADY_SUSPENDED   COMPLETED   1      4m'],
      },
      {
        title: 'Suspend with state', tag: 'FlinkDeployment · savepoint',
        body: 'The operator patches spec.job.state to suspended. Solstice reports the savepoint REQUESTED, then COMPLETED once Flink reports the job suspended, or FAILED if Flink reports an error. It will not suspend a job whose upgradeMode is not savepoint.',
        nodes: [{ label: 'FLINKDEPLOYMENT', sub: 'job.state: suspended' }, { label: 'FLINK K8S OPERATOR', sub: 'takes the savepoint' }, { label: 'SAVEPOINT', sub: 's3://solstice/savepoints' }],
        log: ['[demo] Waiting for a new savepoint to complete (up to 300s)', '[demo] Waiting for Flink to report the job suspended (up to 300s)', '[demo] Suspended with savepoint s3://solstice/savepoints/savepoint-44b668-aeecd7642e07'],
      },
      {
        title: 'Resume from it', tag: 'initialSavepointPath',
        body: 'When the grid is clean again the operator writes that job’s own savepoint into spec.job.initialSavepointPath and sets the state back to running. The restore is confirmed from Flink’s own JobManager log, not from Solstice. A job with no savepoint of its own is never resumed.',
        nodes: [{ label: 'CLEAN GRID', sub: 'below threshold' }, { label: 'SAVEPOINT PATH', sub: 'its own savepoint only' }, { label: 'JOB RUNNING', sub: 'restored by Flink' }],
        log: ['$ make demo-clean', '[demo] Grid set to clean', '[demo] Waiting for Flink to restore from s3://solstice/savepoints/savepoint-44b668-aeecd7642e07 (up to 300s)', '[demo] Resumed from savepoint s3://solstice/savepoints/savepoint-44b668-aeecd7642e07'],
      },
    ],
  },
  capabilities: {
    intro: 'Solstice has run end to end on a local cluster; nothing has run in production. Only Apache Flink is supported, because the savepoint mechanism is Flink-specific.',
    tables: [
      {
        title: 'Status of each capability',
        head: ['Capability', 'Status'],
        statusCol: 1,
        rows: [
          ['Suspend and resume through the FlinkDeployment, with savepoints', 'Implemented; run end to end on a local cluster'],
          ['Safety rules: no suspend without a savepoint, no resume from anything but the job’s own', 'Implemented'],
          ['Threshold, forecast and optimising scheduling policies', 'Implemented; evaluated on generated traces only'],
          ['Cost predictors: static, observed, regression', 'Implemented; recorded durations not yet accurate on a live cluster'],
          ['Prometheus metrics on port 9400 and a Grafana dashboard', 'Implemented'],
          ['Published multi-arch images and an end-to-end test on kind in CI', 'Roadmap'],
          ['Hysteresis and a minimum suspension time for the threshold policy', 'Roadmap'],
          ['Namespace-scoped permissions', 'Roadmap'],
        ],
      },
      {
        title: 'Safety: what Solstice does and does not do',
        head: ['Situation', 'What Solstice does'],
        rows: [
          ['FlinkDeployment’s upgradeMode is not savepoint', 'Does not suspend it. Flink would stop it without a savepoint.'],
          ['Suspend requested', 'Reports the savepoint REQUESTED, then COMPLETED once Flink reports the job suspended, or FAILED if Flink reports an error'],
          ['A job has no savepoint of its own', 'Does not resume it, rather than start it with empty state'],
          ['Telemetry unreachable, erroring or stale', 'Holds every job where it is, neither suspending nor resuming'],
          ['Non-cooperative mode without a savepoint', 'Does not scale the job down'],
        ],
      },
      {
        title: 'Replayed over 14 days of generated grid traces (5 min savepoint, 10 min restart)',
        head: ['Trace', 'Policy', 'gCO2 avoided', 'Suspensions', 'Wasted'],
        rows: [
          ['diurnal', 'threshold', '15453', '92', '55'],
          ['diurnal', 'forecast', '14277', '14', '0'],
          ['spiky', 'threshold', '32741', '72', '2'],
          ['spiky', 'forecast', '32165', '57', '0'],
          ['flickering', 'threshold', '3529', '71', '28'],
          ['flickering', 'forecast', '999', '8', '0'],
        ],
        note: 'A wasted suspension is shorter than the round trip that paid for it. These are upper bounds: the traces are generated, and the forecast policy is given the true future.',
      },
    ],
    limits: [
      'The carbon figure is an estimate, not a measurement: suspended time multiplied by nodePowerWatts and the intensity observed. It assumes freed capacity is genuinely idle.',
      'With Flink Kubernetes Operator 1.14, a suspended job’s JobManager keeps running and only its TaskManagers are released, so set nodePowerWatts for the TaskManager capacity.',
      'On a live cluster the recorded suspend and restart durations are not yet accurate; use the static cost predictor until that is fixed.',
      'The threshold policy has no hysteresis, so an intensity hovering at the threshold suspends and resumes repeatedly. The forecast policy avoids this when a forecast is available.',
      'The operator’s permissions are cluster-wide, and a SolsticeController can point at FlinkDeployments in any namespace. Run it only where everyone who can create one is trusted.',
    ],
  },
  docs: [
    ['README', 'README.md', 'Overview, safety, configuration, metrics, limits'],
    ['API reference', 'docs/api-reference.md', 'Reference for the project’s APIs'],
    ['Grafana dashboard', 'grafana/solstice-dashboard.json', 'Provisioned automatically by make up'],
    ['Helm chart', 'charts/solstice', 'CRD, operator and telemetry service'],
    ['Contributing', 'CONTRIBUTING.md', 'Setup, conventions and how pull requests are reviewed'],
    ['Security policy', 'SECURITY.md', 'Report a vulnerability privately'],
    ['Code of conduct', 'CODE_OF_CONDUCT.md', 'How we treat each other'],
  ],
  involved: {
    maintainers: [{ login: 'yash-agarwa-l', name: 'Yash Agarwal', role: 'Maintainer' }],
    roadmap: [
      'Published multi-arch images, and an end-to-end test on kind in CI',
      'Hysteresis and a minimum suspension time for the threshold policy',
      'Accurate suspend and restart timing from Flink’s own status',
      'Namespace-scoped permissions',
      'Validation against recorded grid history and an imperfect forecast',
      'Exploratory: a learned scheduling policy using reinforcement learning',
      'Exploratory: moving suspended state between peers instead of to object storage',
    ],
    checks: { title: 'Run the tests before you open a pull request', code: 'make test' },
  },
};

// ── adbt ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const adbt: Content = {
  status: 'Released · install with Homebrew, Scoop, the AUR or a release archive · requires adb on your PATH',
  overview: {
    paragraphs: [
      'A fast, keyboard-driven terminal user interface for Android Debug Bridge, built in Go with Charm’s Bubble Tea framework. It gives you a structured, interactive workspace for your Android devices, so you can avoid complex raw shell commands and context-switching.',
    ],
    highlights: [
      ['Everything in one terminal', 'Device info, apps, files, logs, performance, input, intents and port forwarding, each a screen you reach with a keypress.'],
      ['Keyboard first', 'Arrow keys or k and j to move, Enter to select, Esc to go back, q to quit. Module-specific hotkeys are in the shortcuts cheat sheet.'],
      ['Wired or wireless', 'Connected devices are detected in real time, with wireless pairing over IP, port and PIN, and automatic selection when a single device is attached.'],
    ],
  },
  quickstart: {
    intro: 'Install adbt, plug in your device and run adbt. It needs adb on your PATH and exits with install instructions if it is missing. scrcpy is optional, for screen mirroring.',
    blocks: [
      {
        title: 'Install',
        code: `# macOS / Linux (Homebrew)
brew install --cask SakshhamTheCoder/tap/adbt

# Windows (Scoop)
scoop bucket add SakshhamTheCoder https://github.com/SakshhamTheCoder/scoop-bucket
scoop install adbt

# Arch Linux (AUR)
yay -S adbt-bin`,
      },
      { title: 'Run', code: 'adbt            # plug in your device first\nadbt --version  # check which build you are on' },
      {
        title: 'Build from source',
        code: `git clone https://github.com/Ergane-Foundation/adbt.git
cd adbt
go build ./cmd/adbt
./adbt`,
      },
    ],
    notes: [
      'For manual binary downloads (.deb, .rpm or generic archives), use the Releases page or the installation docs.',
      'You need an Android phone or emulator with USB debugging enabled.',
    ],
    tables: [
      {
        title: 'Basic keys (the full list is in the shortcuts cheat sheet)',
        head: ['Key', 'Action'],
        codeCols: [0],
        rows: [
          ['q / Ctrl+C', 'Quit adbt'],
          ['Esc / Backspace', 'Back / go up a directory'],
          ['↑ ↓ / k j', 'Navigate lists and menus'],
          ['Enter', 'Select / confirm / launch'],
        ],
      },
    ],
  },
  how: {
    intro: 'adbt is a thin layer over the adb command: screens in the terminal, one adb wrapper per feature, and a little shared state in between. Select a stage to follow a keypress down to the device.',
    termLabel: 'from the README, docs and source tree',
    stages: [
      {
        title: 'Detect devices', tag: 'adb on your PATH',
        body: 'adbt checks that adb is installed, lists connected devices in real time and selects automatically when only one is attached. Wireless pairing works over IP, port and PIN.',
        nodes: [{ label: 'ADB ON PATH', sub: 'required' }, { label: 'DEVICE LIST', sub: 'updates in real time' }, { label: 'SELECTED DEVICE', sub: 'auto if only one' }],
        log: ['$ adbt --version', '# requires adb on your PATH and exits with install instructions if missing', '# wireless pairing over IP / port / PIN', '# one attached device is selected automatically'],
      },
      {
        title: 'Choose a screen', tag: 'Bubble Tea TUI',
        body: 'From the dashboard you reach eight screens: device info, app manager, file explorer, logcat viewer, performance monitor, input sender, intent tester and port forwarding, all from the keyboard.',
        nodes: [{ label: 'DASHBOARD', sub: 'device at a glance' }, { label: 'SCREENS', sub: 'apps·files·logcat·ports' }, { label: 'KEYBOARD', sub: 'j/k · Enter · Esc · q' }],
        log: ['↑ ↓ / k j       navigate lists and menus', 'Enter           select / confirm / launch', 'Esc / Backspace back / go up a directory', 'q / Ctrl+C      quit adbt'],
      },
      {
        title: 'Talk to adb', tag: 'internal/adb',
        body: 'Each feature has its own adb wrapper in internal/adb: apps, files, logcat, input, intents, ports, capture, monitoring and device info. Anything passed to adb shell is quoted, so user input cannot run extra commands.',
        nodes: [{ label: 'SCREEN ACTION', sub: 'a keypress' }, { label: 'INTERNAL/ADB', sub: 'one wrapper per feature' }, { label: 'ADB', sub: 'on your PATH' }, { label: 'ANDROID DEVICE', sub: 'USB or Wi-Fi' }],
        log: ['# internal/adb: app_manager.go, files.go, logcat.go, ports.go, …', '# one file per feature, plus client.go and devices.go', '# anything passed to adb shell is quoted'],
      },
      {
        title: 'Render', tag: 'internal/ui · internal/state',
        body: 'Screens, components and navigation live in internal/ui, with shared application state in internal/state. Live output such as logcat and the performance monitor streams into the terminal.',
        nodes: [{ label: 'INTERNAL/STATE', sub: 'app state' }, { label: 'INTERNAL/UI', sub: 'screens · navigation' }, { label: 'YOUR TERMINAL', sub: 'live output' }],
        log: ['$ go build ./cmd/adbt', '$ ./adbt', '# internal/ui: components, navigation, screens', '# internal/state: app.go'],
      },
    ],
  },
  capabilities: {
    intro: 'What each screen does, from the README.',
    tables: [
      {
        title: 'Features',
        head: ['Feature', 'What it does'],
        rows: [
          ['Device management', 'Real-time connected device detection, wireless pairing over IP/port/PIN, and automatic selection when a single device is attached.'],
          ['Device info', 'Model, serial, Android version, battery, storage, screen size and density, and IP address, plus Wi-Fi and screen toggles and reboot controls (device, recovery, bootloader).'],
          ['Scrcpy integration', 'Launch high-performance screen mirroring with a single keypress.'],
          ['Screen capture', 'Take screenshots and record the screen from Device Info, saved to your host machine.'],
          ['Performance monitor', 'Real-time CPU, memory and network usage, plus live battery level, temperature, voltage and health.'],
          ['App manager', 'Browse, search and filter user and system apps; inspect per-app details; multi-select for batch uninstall; install or extract APKs; launch, force-stop or clear data.'],
          ['File explorer', 'Browse the device filesystem, push and pull files, create directories, and delete with confirmation.'],
          ['Logcat viewer', 'Live stream device logs with severity filters, search highlighting, filtering by package or PID, pause and resume, clear, and one-key save to a file.'],
          ['Input sender', 'Type text and send key events (Back, Home, Recents, arrows and more), with an optional live keystroke-forwarding mode.'],
          ['Intent tester', 'Construct and send custom activity and broadcast intents to test deep links and receiver behavior.'],
          ['Port forwarding', 'Configure forward and reverse network connections between your host and device.'],
        ],
      },
    ],
  },
  docs: [
    ['README', 'README.md', 'Features, installation and usage'],
    ['Documentation site', 'https://adbt-tui.vercel.app/', 'Guides, shortcuts and troubleshooting'],
    ['Installation', 'https://adbt-tui.vercel.app/docs/installation/', 'Every way to install adbt'],
    ['Keyboard shortcuts', 'https://adbt-tui.vercel.app/docs/shortcuts/', 'Cheat sheet for every screen'],
    ['Troubleshooting', 'https://adbt-tui.vercel.app/docs/troubleshooting/', 'Connection issues, unauthorized devices, missing adb'],
    ['Changelog', 'CHANGELOG.md', 'What changed in each release'],
    ['Contributing', 'CONTRIBUTING.md', 'Setup, checks and how pull requests are reviewed'],
    ['Maintainers', 'MAINTAINERS.md', 'Who maintains it and how decisions are made'],
    ['Support', 'SUPPORT.md', 'Where to ask questions and report bugs'],
    ['Security policy', 'SECURITY.md', 'Report a vulnerability privately'],
    ['Releases', 'releases', 'Binaries, .deb, .rpm and archives'],
  ],
  involved: {
    maintainers: [{ login: 'SakshhamTheCoder', name: 'Sakshham Bhagat', role: 'Lead maintainer' }],
    decisions: 'Small changes are decided in the pull request. Larger changes (new screens, changed shortcuts, new dependencies) start as an issue so others can comment; the lead maintainer makes the final call and records the reason in the issue. Comment on the issue you want to work on and wait to be assigned, so two people do not do the same work. Contributors who make several solid pull requests may be invited to become maintainers.',
    checks: { title: 'Run these before you open a pull request', code: `gofmt -l .        # must print nothing\ngo vet ./...\ngo test ./...` },
  },
};

export const content: Record<string, Content> = { vajra, watchdog, faceproof, solstice, adbt };
