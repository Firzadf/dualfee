import { motion, useReducedMotion } from 'framer-motion';
import type { Point } from '../lib/history';

const W = 600;
const H = 160;
const PAD = { l: 8, r: 8, t: 12, b: 12 };

/** Minimal responsive SVG line chart. Renders only the given points; an empty series says so. */
export default function LineChart({ points, color, title, format }: { points: Point[]; color: string; title: string; format: (v: number) => string }) {
  const reduce = useReducedMotion();
  if (points.length === 0) {
    return (
      <div className="panel grid gap-2">
        <div className="label">{title}</div>
        <div className="grid h-28 place-items-center rounded-lg border border-dashed border-ink-700 font-mono text-[11px] text-ink-500">no measurements yet</div>
      </div>
    );
  }
  const ts = points.map((p) => p.t);
  const vs = points.map((p) => p.v);
  const t0 = Math.min(...ts), t1 = Math.max(...ts);
  let v0 = Math.min(...vs), v1 = Math.max(...vs);
  if (v0 === v1) { v0 -= Math.abs(v0) * 0.05 || 1; v1 += Math.abs(v1) * 0.05 || 1; }
  const x = (t: number) => (t1 === t0 ? W / 2 : PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - (v - v0) / (v1 - v0)) * (H - PAD.t - PAD.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <div className="panel grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label !mb-0">{title}</span>
        <span className="num text-sm" style={{ color }}>{format(last.v)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" preserveAspectRatio="none" role="img" aria-label={`${title}: ${points.length} points, latest ${format(last.v)}`}>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#232835" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />)}
        <motion.path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
        {points.length <= 60 && points.map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.v)} r="2.5" fill={color} />)}
      </svg>
      <div className="flex justify-between font-mono text-[10px] text-ink-500">
        <span>{new Date(t0).toLocaleString()}</span>
        <span>min {format(Math.min(...vs))} · max {format(Math.max(...vs))}</span>
      </div>
    </div>
  );
}
