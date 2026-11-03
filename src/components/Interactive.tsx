'use client';

import { useEffect, useState } from 'react';
import { contributionSteps, flagship } from '@/lib/site';
import { prefersReducedMotion, useTyping } from './hooks';

// ── Vajra pipeline: stage buttons, highlighted SVG schematic, simulated terminal ─────────────────────────────────

type NodeProps = { x: number; y: number; w: number; h: number; label: string; sub?: string; dashed?: boolean };
const Node = ({ x, y, w, h, label, sub, dashed }: NodeProps) => (
  <g className={`n${dashed ? ' dash' : ''}`}>
    <rect x={x} y={y} width={w} height={h} rx={4} />
    <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} className="t">{label}</text>
    {sub ? <text x={x + w / 2} y={y + h / 2 + 12} className="s">{sub}</text> : null}
  </g>
);
const Edge = ({ d }: { d: string }) => <path className="e" d={d} markerEnd="url(#ah)" />;

const logs = flagship.stages.map((s) => s.log);

export function Flagship() {
  const [stage, setStage] = useState(1);
  const term = useTyping(logs[stage - 1]);
  const on = (n: number) => (stage === n ? 'on' : '');
  return (
    <div className="flag">
      <div className="flag-l" role="group" aria-label="Pipeline stages">
        {flagship.stages.map((s) => (
          <button key={s.n} className="stage" type="button" aria-pressed={stage === s.n} onClick={() => setStage(s.n)}>
            <span className="mono">0{s.n}</span><b>{s.title}</b><em className="mono">{s.tag}</em><p>{s.body}</p>
          </button>
        ))}
        <div className="exp">
          <span className="mono">Experimental · not wired in</span>
          <ul>{flagship.experimental.map((e) => <li className="mono" key={e}>{e}</li>)}</ul>
        </div>
      </div>
      <div className="flag-r">
        <div className="diagram">
          <svg viewBox="0 0 720 320" role="img" aria-label="Vajra pipeline: traffic through NFQUEUE into Suricata, alerts in eve.json, the SOAR response engine, then iptables or nftables, the unified log, the WebSocket stream and optional Kafka.">
            <defs>
              <marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke" /></marker>
            </defs>
            <g data-s="1" className={on(1)}>
              <Edge d="M120 55H160" /><Edge d="M270 55H310" /><Edge d="M460 55H510" />
              <Node x={20} y={30} w={100} h={50} label="TRAFFIC" />
              <Node x={160} y={30} w={110} h={50} label="NFQUEUE" />
              <Node x={310} y={30} w={150} h={50} label="SURICATA" sub="inline · local.rules" />
              <Node x={510} y={30} w={190} h={50} label="logs/eve.json" />
            </g>
            <g data-s="2" className={on(2)}>
              <Edge d="M605 80V160H460" /><Edge d="M250 160H310" />
              <Node x={100} y={135} w={150} h={50} label="ALLOWLIST" sub="loopback·host·gw·dns" />
              <Node x={310} y={135} w={150} h={50} label="SOAR ENGINE" sub="block · allow · log" />
            </g>
            <g data-s="3" className={on(3)}>
              <path className="e" d="M385 185V225M605 160V225M95 225H630" />
              <Edge d="M95 225V250" /><Edge d="M275 225V250" /><Edge d="M455 225V250" /><Edge d="M630 225V250" />
              <Node x={20} y={250} w={150} h={50} label="IPTABLES / NFT" sub="enforce block" />
              <Node x={200} y={250} w={150} h={50} label="UNIFIED LOG" sub="unified_events.json" />
              <Node x={380} y={250} w={150} h={50} label="EVENT STREAM" sub="ws /ws/logs" />
              <Node x={560} y={250} w={140} h={50} label="KAFKA" sub="optional" dashed />
            </g>
          </svg>
        </div>
        <div className="term">
          <div className="term-h mono"><span>simulated output · documentation addresses</span><i className="dot" /></div>
          <pre aria-live="off">{term}</pre>
        </div>
      </div>
    </div>
  );
}

// ── Contribution steps ───────────────────────────────────────────────────────────────────────────────────────────

export function ContributionSteps() {
  const [step, setStep] = useState(1);
  return (
    <div className="steps">
      <div className="step-tabs" role="group" aria-label="Contribution steps">
        {contributionSteps.map(([title], i) => (
          <button key={title} className="stage" type="button" aria-pressed={step === i + 1} onClick={() => setStep(i + 1)}>
            <span className="mono">0{i + 1}</span><b>{title}</b>
          </button>
        ))}
      </div>
      <div className="step-body card">
        {contributionSteps.map(([title, body], i) => (
          <div key={title} className={step === i + 1 ? 'on' : ''}>
            <span className="mono">STEP 0{i + 1}</span><h3>{title}</h3><p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Typing command block used in the bento ───────────────────────────────────────────────────────────────────────

export function CycleCli({ commands }: { commands: string[] }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (prefersReducedMotion()) { setText(commands[0]); return; }
    let c = 0, i = 0, dir = 1;
    const id = setInterval(() => {
      i += dir;
      setText(commands[c].slice(0, i));
      if (i >= commands[c].length + 14) dir = -1;
      if (i <= 0) { dir = 1; c = (c + 1) % commands.length; }
    }, 55);
    return () => clearInterval(id);
  }, [commands]);
  return (
    <div className="cli"><span className="mono">$</span> <code>{text}</code><i className="caret" /></div>
  );
}
