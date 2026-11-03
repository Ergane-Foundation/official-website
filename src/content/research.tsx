import type { ReactNode } from 'react';
import { Arrow } from '@/components/icons';

export type Note = { slug: string; project: string; title: string; date: string; kind: string; summary: string; body: ReactNode };

const Draft = ({ children }: { children: ReactNode }) => <p className="draft mono">{children}</p>;
const Code = ({ children }: { children: string }) => <pre className="code"><code>{children}</code></pre>;
const Tbl = ({ head, rows }: { head: string[]; rows: string[][] }) => (
  <div className="tbl">
    <table>
      <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r) => <tr key={r[0] + r[1]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

// Notes are JSX. ponytail: add MDX, Shiki and KaTeX when the first post needs math, diffs or highlighted code.
export const notes: Note[] = [
  {
    slug: 'vajra-never-cuts-the-host-off',
    project: 'vajra',
    title: 'Vajra’s one hard rule: never cut the host off from its own network',
    date: '2026-11-02',
    kind: 'Engineering note',
    summary: 'An inline intrusion prevention system that blocks its own host is worse than none. How Vajra decides what it may never block.',
    body: (
      <>
        <p className="draft mono">Draft · summarised from the Vajra README and docs/architecture.md · core members to review</p>
        <p>An inline IPS sits in the packet path. That is what makes it effective, and it is also what makes a bad decision expensive: block the wrong address and the machine loses its gateway, its DNS, or its own loopback. Vajra is built around one rule that follows from this: <strong>it never cuts the host off from its own network.</strong></p>

        <h2>The pipeline</h2>
        <pre className="code"><code>{`traffic ─► iptables NFQUEUE ─► Suricata (inline, rules/local.rules)
                                   │ logs/eve.json
          ┌────────────────────────┼──────────────────────────┬──────────────────────┐
          ▼                        ▼                          ▼                      ▼
   SOAR engine              Unified logger             Event stream             Kafka bridge
   decide → block IP        logs/unified_events.json   ws://127.0.0.1:8000      (optional)
   (iptables / nftables)                               /ws/logs`}</code></pre>
        <p>Suricata inspects traffic from an NFQUEUE, so packets matching its rules are dropped before they reach the host. It writes events to <code>logs/eve.json</code>, and each Python service tails that file independently.</p>

        <h2>What the response engine blocks</h2>
        <p>The SOAR engine blocks the source of an alert when the alert is critical or high severity, when its signature names an attack class such as SQL injection or scanning, or when an ML model or behaviour analytics flags it with high confidence.</p>

        <h2>What it will never block</h2>
        <div className="tbl">
          <table>
            <thead><tr><th>Situation</th><th>What Vajra does</th></tr></thead>
            <tbody>
              <tr><td>Alert source is loopback, any address on the host, its IPv4 or IPv6 default gateways, or a DNS resolver</td><td>Never blocks it</td></tr>
              <tr><td>Alert source is in <code>--allow</code> or <code>VAJRA_ALLOWLIST</code></td><td>Never blocks it</td></tr>
              <tr><td>Started with <code>--dry-run</code></td><td>Logs each decision as <code>not_enforced</code> and leaves the firewall alone</td></tr>
              <tr><td>No firewall backend (for example macOS)</td><td>Logs the decision as <code>not_enforced</code> rather than reporting a block</td></tr>
              <tr><td>Event stream and inference API</td><td>Listen on 127.0.0.1 only, unless <code>VAJRA_API_HOST</code> says otherwise</td></tr>
            </tbody>
          </table>
        </div>

        <h2>Where it stands</h2>
        <p>Vajra is early stage and not yet released. The inline pipeline is built and has run on development machines; nothing has run in production. The machine learning components exist but are unvalidated and are labelled experimental. Live mode runs as root and inserts NFQUEUE rules, so use a disposable Linux VM and start with <code>--dry-run</code>.</p>
        <p><a href="https://github.com/Ergane-Foundation/vajra" rel="noopener">Vajra on GitHub <Arrow /></a></p>
      </>
    ),
  },

  // ── Watchdog ───────────────────────────────────────────────────────────────────────────────────────────────────
  {
    slug: 'watchdog-hands-and-brain',
    project: 'watchdog',
    title: 'Hands and brain: why watchDog’s backend never touches a target',
    date: '2026-11-03',
    kind: 'Engineering note',
    summary: 'The app does all the network I/O and the backend only correlates, so server-side request forgery is impossible by construction. How the split works and how the engine avoids over-reporting.',
    body: (
      <>
        <Draft>Draft · summarised from the watchDog README and docs/architecture.md · core members to review</Draft>
        <p>watchDog is a guided network security assessment tool for Android, Windows and Linux. Its central design decision is a split: the app does all the network I/O, and the backend only thinks. This note explains the split, how one engine serves three platforms, and how the correlation engine tries not to over-report.</p>

        <h2>Hands and brain</h2>
        <p>The client (phone or desktop app) does 100% of network I/O: network discovery, host discovery, port enumeration, fingerprinting and verification. The backend never connects to a target. It is a pure correlation engine: vulnerability data, matching, prioritization and signed check-definitions that the client runs locally. Because the backend has no code path that reaches a target, server-side request forgery is impossible by construction.</p>
        <p>The client can also correlate on its own, against OSV.dev, CISA KEV and EPSS, using a Kotlin port of the backend engine. Pointing the client at your own backend is optional.</p>

        <h2>One engine, three platforms</h2>
        <p>Scanning and correlation live once in <code>:core</code>, a pure Kotlin/JVM library with no Android dependencies, shared by the Android app and the Compose-for-Desktop app. Only the platform seams differ: <code>:core</code> defines an interface for every platform-dependent service and each app supplies its own implementation.</p>
        <Tbl
          head={['Seam', 'Android', 'Desktop']}
          rows={[
            ['NetworkContext', 'ConnectivityManager', 'java.net.NetworkInterface, with an adapter picker'],
            ['HostDiscoverer (mDNS)', 'NsdManager', 'JmDNS'],
            ['SettingsStore', 'DataStore', 'JSON file'],
            ['Scan, device-watch and WPA stores', 'Room', 'SQLite via sqlite-jdbc'],
            ['SecretStore', 'EncryptedSharedPreferences', 'Java KeyStore file'],
            ['Scan lifecycle', 'Foreground service and notifications', 'Coroutine scope'],
          ]}
        />

        <h2>A scan, step by step</h2>
        <p>Scanning is iterative and user-driven. Each step hands the decision back to you.</p>
        <Tbl
          head={['Step', 'What happens']}
          rows={[
            ['Networks', 'Pick the joined network. History and Settings are reachable from here.'],
            ['Discovering', 'TCP-connect probing, best-effort ICMP and mDNS, merged into a live host list. No port scan yet.'],
            ['SelectDevices', 'Choose which discovered hosts to scan.'],
            ['ChoosePorts', 'Top 100, Top 1000 or all ports.'],
            ['Scanning', 'Bounded-concurrency connect scan, then banner, HTTP and TLS probes, normalized to product, version and distro. No correlation yet.'],
            ['Results', 'A device-centric summary.'],
            ['DeviceDetail', 'Services and raw fingerprints. Vulnerability checks run on demand and their findings are added below the device details, never replacing them.'],
          ]}
        />

        <h2>Fewer false positives</h2>
        <p>The engine turns observed services into ranked, de-duplicated findings with explicit confidence states, from <code>DETECTED</code> through <code>LIKELY_VULNERABLE</code> and <code>VERIFIED</code> to <code>EXPLOITABLE</code>. The hard part of this domain is not finding matches but not over-reporting them.</p>
        <Tbl
          head={['Defence', 'What it does']}
          rows={[
            ['CVE-List-first, not NVD-first', 'NVD stopped enriching most CVEs in 2026.'],
            ['Distro backport suppression', 'A real dpkg version comparator, so OpenSSH_8.2p1 Ubuntu-4ubuntu0.11 is judged patched by the distro even though upstream 8.2p1 looks vulnerable.'],
            ['Version-only matches', 'Never rank above LIKELY_VULNERABLE.'],
            ['CVSS by provenance', 'v4 over v3.1, CNA over NVD, never averaged.'],
            ['KEV and EPSS', 'Drive prioritization so range-match noise does not drown the signal.'],
          ]}
        />
        <p>The engine exists twice: in the TypeScript backend and as a Kotlin port in <code>:core</code>. They are semantics-preserving ports validated against the same golden set, so a change to one must land in the other.</p>

        <h2>Where it stands</h2>
        <p>The app is a non-root MVP: it can only scan the network it is joined to, because Android gives no layer-3 route to a network you have not joined. Live WPA handshake capture is Android-only and needs a USB adapter or root. SYN, ARP, MAC and OS detection are reserved for a future root tier.</p>
        <p><a href="https://github.com/Ergane-Foundation/watchdog" rel="noopener">watchDog on GitHub <Arrow /></a></p>
      </>
    ),
  },

  // ── Faceproof ──────────────────────────────────────────────────────────────────────────────────────────────────
  {
    slug: 'faceproof-offline-verification',
    project: 'faceproof',
    title: 'Offline face verification: what runs on the phone, and what it cannot promise',
    date: '2026-11-03',
    kind: 'Engineering note',
    summary: 'One verification followed from photo to match, and an honest reading of what the accuracy and liveness numbers do and do not show.',
    body: (
      <>
        <Draft>Draft · summarised from the Faceproof README and docs/ARCHITECTURE.md · core members to review</Draft>
        <p>Faceproof is an offline face verification and liveness SDK for React Native, made for places with weak or no internet. Nothing in it needs a network, and that shapes every design choice. This note follows one verification from photo to match, then says plainly what the numbers do and do not show.</p>

        <h2>Everything on the device</h2>
        <p>The SDK makes no network calls and never stores images. Frames are decoded from a base64 string in memory and recycled after use. Templates and the attendance queue live in one SQLCipher database in the app’s private storage, and its passphrase and signing key are random 32-byte secrets encrypted with a non-exportable Android Keystore key. Uploading records is the app’s decision, for example to the reference backend.</p>

        <h2>From photo to match</h2>
        <Code>{`photo (base64, in memory)
  → quality gate       blur + exposure score, cutoff 0.5
  → BlazeFace          boxes + 6 keypoints, 128x128 letterboxed input
  → alignment          similarity transform: eyes, nose, mouth → fixed positions
  → MobileFaceNet      192-value embedding
  → cosine similarity  against every enrolled template, match at 0.54 or above`}</Code>
        <p>Alignment matters a great deal. On a subset of LFW, accuracy went from about 78% with plain box crops to about 99% with alignment, using the same model. That is why BlazeFace runs even when the app passes a face box: the box only selects which face to use.</p>

        <h2>Liveness</h2>
        <p>The liveness check is active challenge-response: two of three challenges (blink, smile, head turn) in random order. Every challenge must start from the opposite pose, so a still photo cannot pass. More than one face fails the session, losing the face resets the current challenge, and the whole session times out after 12 seconds by default.</p>
        <p>It is designed to stop static photos, printed or on a screen, and that has not yet been verified on a device. It does not defend against video replays, deepfakes or masks, and there is no passive anti-spoofing yet. Liveness and matching are separate steps, so an app can run verification without liveness; whether that is acceptable is the app’s call.</p>

        <h2>How sure is a match?</h2>
        <p>The default threshold of 0.54 was chosen for a false accept rate of 1e-4 per comparison on the LFW benchmark. On LFW the model reaches 99.28% 10-fold accuracy, and at the default threshold FAR is 8.0e-5 per comparison with a true accept rate of 92.97%. LFW is likely an upper bound: its photos are clean web photos and the embedding model’s training data overlaps LFW identities.</p>
        <p>Because every verification is compared with everyone enrolled, the chance that a non-enrolled person matches someone grows roughly as N times FAR:</p>
        <Tbl
          head={['People enrolled', 'Chance of a false match (0.54, LFW)']}
          rows={[['10', '0.08%'], ['100', '0.8%'], ['1,000', '7.7%']]}
        />
        <p>For large groups, raise the threshold or split people into smaller groups.</p>

        <h2>Where it stands</h2>
        <p>Faceproof is pre-release and not yet published to npm. Android is supported (API 24+): enrollment, verification, encryption and photo cleanup have been checked on one physical device, while impostor rejection and liveness against spoofs have not. iOS is experimental: it compiles in CI but is untested on a device and needs a Core ML model that is not included. Android and iOS templates are not comparable, because iOS does not align faces yet.</p>
        <Tbl
          head={['Light', 'ML Kit box', 'Result', 'Median total']}
          rows={[
            ['Even front light', 'on', '5 of 5 MATCH', '147 ms'],
            ['Even front light', 'off', '4 of 5 MATCH', '237 ms'],
            ['Dim indoor', 'on', '2 of 10 MATCH', '—'],
          ]}
        />
        <p>One phone (a Samsung Galaxy A17), one person, a small sample. Dim light fails the quality gate before matching.</p>
        <p><a href="https://github.com/Ergane-Foundation/faceproof" rel="noopener">Faceproof on GitHub <Arrow /></a></p>
      </>
    ),
  },

  // ── Solstice ───────────────────────────────────────────────────────────────────────────────────────────────────
  {
    slug: 'solstice-never-suspend-without-state',
    project: 'solstice',
    title: 'Never suspend without state: pausing a Flink job for a dirty grid',
    date: '2026-11-03',
    kind: 'Engineering note',
    summary: 'The one rule behind Solstice, how it suspends and resumes through the Flink operator, and what its policy evaluation does and does not show.',
    body: (
      <>
        <Draft>Draft · summarised from the Solstice README · core members to review</Draft>
        <p>Carbon-aware scaling is straightforward for stateless and batch workloads. Stream processors are the awkward case: stopping one carelessly throws away in-flight windowed state and breaks exactly-once processing. Solstice suspends a stateful Apache Flink job when the grid is dirty and resumes it from a savepoint when the grid is clean, so the job picks up where it left off.</p>

        <h2>The rule</h2>
        <p><strong>A job is never suspended unless its state is captured first, and never resumed from anything but its own savepoint.</strong> The tests concentrate on these safety rules, and any change to the suspend or resume path must keep them passing.</p>
        <Tbl
          head={['Situation', 'What Solstice does']}
          rows={[
            ['upgradeMode is not savepoint', 'Does not suspend it. Flink would stop it without a savepoint.'],
            ['Suspend requested', 'Reports the savepoint REQUESTED, then COMPLETED once Flink reports the job suspended, or FAILED if Flink reports an error.'],
            ['A job has no savepoint of its own', 'Does not resume it, rather than start it with empty state.'],
            ['Telemetry unreachable, erroring or stale', 'Holds every job where it is, neither suspending nor resuming.'],
            ['Non-cooperative mode without a savepoint', 'Does not scale the job down.'],
          ]}
        />

        <h2>The mechanism</h2>
        <Code>{`Electricity Maps ──▶ Telemetry ──▶ Solstice operator ──▶ FlinkDeployment
                                          │                     │
                                          │                     ▼
                                          │          Flink Kubernetes Operator
                                          ▼                     │
                                    Prometheus                  ▼
                                          │             savepoints on S3
                                          ▼
                                      Grafana`}</Code>
        <p>The operator reconciles every 60 seconds. On a dirty grid it patches <code>FlinkDeployment.spec.job.state</code> to suspended, and the Flink Kubernetes Operator takes a savepoint before stopping the job. On a clean grid it writes that job’s savepoint into <code>spec.job.initialSavepointPath</code> and sets the state back to running.</p>
        <p>Going through the FlinkDeployment rather than scaling the Deployment directly matters: the Flink operator owns that Deployment and will undo any replica change made behind its back.</p>

        <h2>Deciding when</h2>
        <Tbl
          head={['Policy', 'Behaviour']}
          rows={[
            ['threshold', 'Suspend whenever carbon is above the threshold.'],
            ['forecast', 'Look at how long the dirty stretch lasts and decline windows too short to pay for the savepoint and restart.'],
            ['optimising', 'As forecast, and when more jobs want suspending than the limit allows, prefer the ones avoiding most carbon per second of disruption.'],
          ]}
        />
        <p>Replayed over fourteen days of three generated grid traces, with a 5 minute savepoint and 10 minute restart, the forecast policy cut disruption sharply where the grid flips often: on the flickering trace it made 8 suspensions with none wasted, against 71 with 28 wasted for the threshold policy, at the price of less carbon avoided (999 g against 3529 g). Where dirty stretches are long and few, it changed little.</p>
        <p>Treat these as upper bounds. The traces are generated from a seed rather than recorded from a real grid, and the forecast policy is given the trace’s true future as its forecast. A real forecast is wrong some of the time and would do worse.</p>

        <h2>Predicting the cost</h2>
        <p>The operator records how long each suspend and restart took, so its estimates can follow the cluster. The <code>static</code> predictor uses configured constants, <code>observed</code> uses the median and percentiles of what the cluster actually did (three observations needed), and <code>regression</code> fits state size and parallelism (eight needed). Each falls back to the simpler one when there is too little history. On synthetic data, where savepoint duration tracks state size, the regression predictor had a mean absolute error of 5 seconds, against 65 seconds for static.</p>
        <p>On a live cluster the recorded durations are not yet accurate: the timer stops on the first reconcile after the patch, so each observation is roughly the 60 second reconcile interval. Until that is fixed, use <code>static</code>.</p>

        <h2>Where it stands</h2>
        <p>Solstice is early stage and not yet released. The suspend and resume lifecycle has run end to end on a local cluster; nothing has run in production. Only Apache Flink is supported, the carbon figure is an estimate rather than a measurement, and the operator’s permissions are cluster-wide, so run it only where everyone who can create a SolsticeController is trusted.</p>
        <p><a href="https://github.com/Ergane-Foundation/solstice" rel="noopener">Solstice on GitHub <Arrow /></a></p>
      </>
    ),
  },

  // ── adbt ───────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    slug: 'adbt-a-thin-tui-over-adb',
    project: 'adbt',
    title: 'adbt: a keyboard-driven layer over adb',
    date: '2026-11-03',
    kind: 'Engineering note',
    summary: 'How a terminal UI for Android Debug Bridge is laid out, and the rules that keep it from running more than you asked.',
    body: (
      <>
        <Draft>Draft · summarised from the adbt README and CONTRIBUTING.md · core members to review</Draft>
        <p>adbt is a keyboard-driven terminal UI for Android Debug Bridge, written in Go with Charm’s Bubble Tea framework. It is deliberately a thin layer: it does not reimplement adb, it drives it. This note walks through how the code is laid out and the rules that keep it safe.</p>

        <h2>What it covers</h2>
        <p>From the dashboard you reach device info, an app manager, a file explorer, a logcat viewer, a performance monitor, an input sender, an intent tester and port forwarding. Connected devices are detected in real time, wireless pairing works over IP, port and PIN, and a single attached device is selected automatically. scrcpy screen mirroring is one keypress away when scrcpy is installed.</p>

        <h2>How it is put together</h2>
        <Code>{`cmd/adbt/           entry point
internal/adb/       one file per feature: app_manager.go, files.go, logcat.go,
                    ports.go, input.go, intents.go, capture.go, monitor.go, …
                    plus client.go and devices.go
internal/state/     app.go: shared application state
internal/ui/        app.go · components/ · navigation/ · screens/
website/            documentation website
.goreleaser.yaml    release builds`}</Code>
        <p>A keypress on a screen calls into <code>internal/adb</code>, which runs the <code>adb</code> command on your PATH against the selected device, and the result streams back into the terminal. adbt requires adb on your PATH and exits with install instructions if it is missing.</p>

        <h2>Rules that keep it safe</h2>
        <p>Anything passed to <code>adb shell</code> is quoted, so user input cannot run extra commands. That rule is part of what a pull request is reviewed against, along with tests for new behavior, documentation updates when shortcuts change, and a licence check on any new dependency.</p>

        <h2>Shipping</h2>
        <p>Releases are built with GoReleaser and distributed as a Homebrew cask, a Scoop bucket, an AUR package (<code>adbt-bin</code>) and .deb, .rpm and archive downloads from the Releases page. Changes follow Conventional Commits, with scopes such as adb, ui, apps, files, logcat, devices, release and website.</p>
        <Code>{`gofmt -l .        # must print nothing
go vet ./...
go test ./...`}</Code>
        <p><a href="https://github.com/Ergane-Foundation/adbt" rel="noopener">adbt on GitHub <Arrow /></a></p>
      </>
    ),
  },
];
