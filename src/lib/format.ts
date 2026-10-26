import { formatUnits } from '@dualfee/sdk';

export const tpot = (planck: bigint, decimals = 14, frac = 6) => formatUnits(planck, decimals, frac);

export function fmtRatio(r: number | null): string {
  if (r === null) return '—';
  if (r >= 100) return `${Math.round(r).toLocaleString('en-US')}×`;
  if (r >= 10) return `${r.toFixed(1)}×`;
  return `${r.toFixed(3)}×`;
}

export function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export const short = (h: string, n = 6) => (h.length > 2 * n + 2 ? `${h.slice(0, n + 2)}…${h.slice(-n)}` : h);
