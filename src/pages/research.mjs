import { links } from '../site.mjs';
import { u, arrow } from '../layout.mjs';
import { secHead } from '../parts.mjs';

// Notes are plain HTML fragments. ponytail: add a markdown pipeline (Shiki, KaTeX) when the first post needs math or diffs.
export const notes = [
  {
    slug: 'vajra-never-cuts-the-host-off',
    title: 'Vajra’s one hard rule: never cut the host off from its own network',
    date: '2026-11-02',
    kind: 'Engineering note',
    summary: 'An inline intrusion prevention system that blocks its own host is worse than none. How Vajra decides what it may never block.',
    body: `
<p class="draft mono">Draft · summarised from the Vajra README and docs/architecture.md · maintainers to review</p>
<p>An inline IPS sits in the packet path. That is what makes it effective, and it is also what makes a bad decision expensive: block the wrong address and the machine loses its gateway, its DNS, or its own loopback. Vajra is built around one rule that follows from this: <strong>it never cuts the host off from its own network.</strong></p>

<h2>The pipeline</h2>
<pre class="code"><code>traffic ─► iptables NFQUEUE ─► Suricata (inline, rules/local.rules)
                                   │ logs/eve.json
          ┌────────────────────────┼──────────────────────────┬──────────────────────┐
          ▼                        ▼                          ▼                      ▼
   SOAR engine              Unified logger             Event stream             Kafka bridge
   decide → block IP        logs/unified_events.json   ws://127.0.0.1:8000      (optional)
   (iptables / nftables)                               /ws/logs</code></pre>
<p>Suricata inspects traffic from an NFQUEUE, so packets matching its rules are dropped before they reach the host. It writes events to <code>logs/eve.json</code>, and each Python service tails that file independently.</p>

<h2>What the response engine blocks</h2>
<p>The SOAR engine blocks the source of an alert when the alert is critical or high severity, when its signature names an attack class such as SQL injection or scanning, or when an ML model or behaviour analytics flags it with high confidence.</p>

<h2>What it will never block</h2>
<div class="tbl"><table><thead><tr><th>Situation</th><th>What Vajra does</th></tr></thead><tbody>
<tr><td>Alert source is loopback, any address on the host, its IPv4 or IPv6 default gateways, or a DNS resolver</td><td>Never blocks it</td></tr>
<tr><td>Alert source is in <code>--allow</code> or <code>VAJRA_ALLOWLIST</code></td><td>Never blocks it</td></tr>
<tr><td>Started with <code>--dry-run</code></td><td>Logs each decision as <code>not_enforced</code> and leaves the firewall alone</td></tr>
<tr><td>No firewall backend (for example macOS)</td><td>Logs the decision as <code>not_enforced</code> rather than reporting a block</td></tr>
<tr><td>Event stream and inference API</td><td>Listen on 127.0.0.1 only, unless <code>VAJRA_API_HOST</code> says otherwise</td></tr>
</tbody></table></div>

<h2>Where it stands</h2>
<p>Vajra is early stage and not yet released. The inline pipeline is built and has run on development machines; nothing has run in production. The machine learning components exist but are unvalidated and are labelled experimental. Live mode runs as root and inserts NFQUEUE rules, so use a disposable Linux VM and start with <code>--dry-run</code>.</p>
<p><a href="https://github.com/Ergane-Foundation/vajra" rel="noopener">Vajra on GitHub ${arrow}</a></p>`,
  },
];

export function researchIndex() {
  return `
<section class="sec page-h">
  ${secHead('RESEARCH // ENGINEERING', 'Engineering notes & RFCs', 'Technical write-ups, design decisions and proposals from the foundation’s projects.')}
</section>
<section class="sec">
  ${secHead('01 // NOTES', 'Latest')}
  <ul class="posts">${notes.map((n) => `<li><a class="card spot" href="${u(`/research/${n.slug}/`)}"><span class="mono">${n.kind} · ${n.date}</span><h3>${n.title}</h3><p>${n.summary}</p></a></li>`).join('')}</ul>
</section>
<section class="sec">
  ${secHead('02 // RFCS', 'Proposals')}
  <p class="empty">No RFCs have been published yet. To bring a project to Ergane, <a href="${links.propose}" rel="noopener">propose it here ${arrow}</a>.</p>
</section>`;
}

export function notePage(n) {
  return `
<article class="sec doc">
  <a class="crumb mono" href="${u('/research/')}">← Research</a>
  <span class="mono">${n.kind} · ${n.date}</span>
  <h1>${n.title}</h1>
  <div class="prose">${n.body}</div>
</article>`;
}
