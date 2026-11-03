'use client';

import { useState } from 'react';
import type { Stage } from '@/content/projects';
import { DIAGRAM_W, layoutStages, NODE_H } from '@/lib/diagram';
import { useTyping } from './hooks';

// "How it works": stage buttons on the left, a schematic whose active stage lights up, and a small terminal with that
// stage's commands or snippets (labelled with where they come from).

const Node = ({ x, y, w, h, label, sub, dashed }: { x: number; y: number; w: number; h: number; label: string; sub?: string; dashed?: boolean }) => (
  <g className={`n${dashed ? ' dash' : ''}`}>
    <rect x={x} y={y} width={w} height={h} rx={4} />
    <text x={x + w / 2} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} className="t">{label}</text>
    {sub ? <text x={x + w / 2} y={y + h / 2 + 12} className="s">{sub}</text> : null}
  </g>
);
const Edge = ({ d }: { d: string }) => <path className="e" d={d} markerEnd="url(#ah)" />;
const Defs = () => (
  <defs>
    <marker id="ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke" /></marker>
  </defs>
);

// Vajra's pipeline fans out from one alert log, which the generic row layout cannot draw, so it keeps a hand-placed schematic.
function VajraDiagram({ on }: { on: (n: number) => string }) {
  return (
    <svg viewBox="0 0 720 320" role="img" aria-label="Vajra pipeline: traffic through NFQUEUE into Suricata, alerts in eve.json, the SOAR response engine, then iptables or nftables, the unified log, the WebSocket stream and optional Kafka.">
      <Defs />
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
  );
}

function AutoDiagram({ stages, on, label }: { stages: Stage[]; on: (n: number) => string; label: string }) {
  const { rows, edges, height } = layoutStages(stages);
  return (
    <svg viewBox={`0 0 ${DIAGRAM_W} ${height}`} role="img" aria-label={label}>
      <Defs />
      {rows.map((row, i) => (
        <g key={stages[i].title} data-s={i + 1} className={on(i + 1)}>
          {edges[i].map((d) => <Edge key={d} d={d} />)}
          {row.map((p) => <Node key={p.node.label} x={p.x} y={p.y} w={p.w} h={NODE_H} label={p.node.label} sub={p.node.sub} dashed={p.node.dashed} />)}
        </g>
      ))}
    </svg>
  );
}

export function Pipeline({ stages, termLabel, experimental, diagram, name }: { stages: Stage[]; termLabel: string; experimental?: string[]; diagram?: 'vajra'; name: string }) {
  const [stage, setStage] = useState(1);
  const term = useTyping(stages[stage - 1].log);
  const on = (n: number) => (stage === n ? 'on' : '');
  return (
    <div className="flag">
      <div className="flag-l" role="group" aria-label="Pipeline stages">
        {stages.map((s, i) => (
          <button key={s.title} className="stage" type="button" aria-pressed={stage === i + 1} onClick={() => setStage(i + 1)}>
            <span className="mono">0{i + 1}</span><b>{s.title}</b><em className="mono">{s.tag}</em><p>{s.body}</p>
          </button>
        ))}
        {experimental?.length ? (
          <div className="exp">
            <span className="mono">Experimental · not wired in</span>
            <ul>{experimental.map((e) => <li className="mono" key={e}>{e}</li>)}</ul>
          </div>
        ) : null}
      </div>
      <div className="flag-r">
        <div className="diagram">
          {diagram === 'vajra'
            ? <VajraDiagram on={on} />
            : <AutoDiagram stages={stages} on={on} label={`${name} pipeline: ${stages.map((s) => s.title).join(', ')}.`} />}
        </div>
        <div className="term">
          <div className="term-h mono"><span>{termLabel}</span><i className="dot" /></div>
          <pre aria-live="off">{term}</pre>
        </div>
      </div>
    </div>
  );
}
