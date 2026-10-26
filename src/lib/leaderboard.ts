import { estimateBoth, presetOps, serializeComparison, type Comparison, type NetworkConfig } from '@dualfee/sdk';

export type Row = { id: string; label: string; detail: string; comparison: Comparison };
export type Cache = { measuredAt: string; rows: { id: string; label: string; detail: string; comparison: string }[] };

const KEY = 'dualfee.leaderboard.v1';

const BIG_FIELDS = new Set(['gas', 'gasPrice', 'feeWei', 'totalPlanck', 'partialFee', 'storageDeposit', 'refTime', 'proofSize', 'savingsPlanck']);

/** Parse a cached comparison back, restoring bigint fields by name (not by heuristics). */
export function parseComparison(s: string): Comparison {
  return JSON.parse(s, (k, v) => (BIG_FIELDS.has(k) && typeof v === 'string' ? BigInt(v) : v)) as Comparison;
}

export function loadCache(): { measuredAt: string; rows: Row[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    return { measuredAt: c.measuredAt, rows: c.rows.map((r) => ({ ...r, comparison: parseComparison(r.comparison) })) };
  } catch {
    return null;
  }
}

export function saveCache(rows: Row[], measuredAt: string) {
  const c: Cache = { measuredAt, rows: rows.map((r) => ({ id: r.id, label: r.label, detail: r.detail, comparison: serializeComparison(r.comparison) })) };
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* storage full or disabled */ }
}

/** Measures every preset op live, one at a time (keeps the public RPCs happy). */
export async function measureAll(network: NetworkConfig, onRow: (r: Row) => void): Promise<Row[]> {
  const rows: Row[] = [];
  for (const op of presetOps()) {
    const comparison = await estimateBoth(op.tx, { network });
    const row = { id: op.id, label: op.label, detail: op.detail, comparison };
    rows.push(row);
    onRow(row);
  }
  return rows;
}
