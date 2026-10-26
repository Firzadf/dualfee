import { serializeComparison, type Comparison } from '@dualfee/sdk';

export const REPORT_SCHEMA = 'dualfee.report/v1';

export type Report = {
  schema: typeof REPORT_SCHEMA;
  generatedAt: string;
  app: string;
  op: { id: string; label: string; shareUrl?: string };
  network: { evmRpc: string; substrateWss: string; chainId: number; nativeDecimals: number; evmDecimals: number };
  comparison: unknown;
  stamp: { alg: 'SHA-256'; over: 'canonical JSON of the report without "stamp"'; hash: string };
};

/** Deterministic JSON: object keys sorted, bigints as decimal strings, no whitespace. */
export function canonicalize(v: unknown): string {
  if (typeof v === 'bigint') return JSON.stringify(v.toString());
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? 'null' : canonicalize(x))).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(o[k])}`).join(',')}}`;
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function buildReport(c: Comparison, meta: { opId: string; label: string; shareUrl?: string; network: Report['network']; app?: string; generatedAt?: string }): Promise<Report> {
  const body: Omit<Report, 'stamp'> = {
    schema: REPORT_SCHEMA,
    generatedAt: meta.generatedAt ?? new Date().toISOString(),
    app: meta.app ?? 'https://dualfee.vercel.app',
    op: { id: meta.opId, label: meta.label, ...(meta.shareUrl ? { shareUrl: meta.shareUrl } : {}) },
    network: meta.network,
    comparison: JSON.parse(serializeComparison(c)),
  };
  const hash = await sha256Hex(canonicalize(body));
  return { ...body, stamp: { alg: 'SHA-256', over: 'canonical JSON of the report without "stamp"', hash } };
}

export type VerifyResult =
  | { ok: true; hash: string; report: Report }
  | { ok: false; reason: string; expected?: string; actual?: string };

/** Recompute the stamp. Proves the file was not edited after export; it is not a signature (no origin proof). */
export async function verifyReport(text: string): Promise<VerifyResult> {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, reason: 'Not valid JSON.' }; }
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'Not a report object.' };
  const r = parsed as Partial<Report>;
  if (r.schema !== REPORT_SCHEMA) return { ok: false, reason: `Unknown schema (expected ${REPORT_SCHEMA}).` };
  if (!r.stamp || typeof r.stamp.hash !== 'string' || !/^[0-9a-f]{64}$/.test(r.stamp.hash)) return { ok: false, reason: 'Missing or malformed stamp.hash.' };
  const { stamp, ...body } = r;
  const actual = await sha256Hex(canonicalize(body));
  if (actual !== stamp.hash) return { ok: false, reason: 'Hash mismatch: the report was modified after export.', expected: stamp.hash, actual };
  return { ok: true, hash: actual, report: r as Report };
}
