import type { Stage, StageNode } from '@/content/projects';

export const DIAGRAM_W = 720;
export const NODE_H = 50;
const ROW = 100;
const GAP = 36;
const PAD = 20;
const TOP = 20;
const MAX_NODE_W = 170;

export type Placed = { node: StageNode; x: number; y: number; w: number; h: number };

// Auto layout for a project's "How it works" diagram: one row per stage, nodes spread across it and joined left to right,
// with an elbow connector from the last node of a stage to the first node of the next. Edges belong to the stage they enter.
export function layoutStages(stages: Pick<Stage, 'nodes'>[]) {
  const rows: Placed[][] = stages.map((s, i) => {
    const nodes = s.nodes ?? [];
    const w = Math.min(MAX_NODE_W, (DIAGRAM_W - 2 * PAD - (nodes.length - 1) * GAP) / Math.max(nodes.length, 1));
    const x0 = (DIAGRAM_W - (nodes.length * w + (nodes.length - 1) * GAP)) / 2;
    return nodes.map((node, j) => ({ node, x: x0 + j * (w + GAP), y: TOP + i * ROW, w, h: NODE_H }));
  });
  const edges: string[][] = rows.map((row, i) => {
    const out = row.slice(1).map((n, j) => `M${row[j].x + row[j].w} ${n.y + NODE_H / 2}H${n.x}`);
    if (i > 0 && row.length) {
      const last = rows[i - 1][rows[i - 1].length - 1];
      const y1 = last.y + NODE_H;
      const y2 = row[0].y;
      out.push(`M${last.x + last.w / 2} ${y1}V${y1 + (y2 - y1) / 2}H${row[0].x + row[0].w / 2}V${y2}`);
    }
    return out;
  });
  return { rows, edges, height: TOP + stages.length * ROW };
}
