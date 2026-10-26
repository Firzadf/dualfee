import type { Comparison } from '@dualfee/sdk';

/** One saved measurement. Big amounts are decimal strings (planck / wei) so the entry is plain JSON. */
export type HistoryEntry = {
  id: string;
  at: string;
  opId: string;
  label: string;
  source: 'lab' | 'leaderboard' | 'landing' | 'calculator';
  recommended: string | null;
  ratioAllIn: number | null;
  ratioFeeOnly: number | null;
  evmPlanck: string | null;
  evmGasPrice: string | null;
  evmBlock: number | null;
  nativeFee: string | null;
  nativeDeposit: string | null;
  nativeBlock: number | null;
};

export type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const HISTORY_KEY = 'dualfee.history.v1';
export const HISTORY_MAX = 500;
export const HISTORY_EVENT = 'dualfee:history';

function local(): KV | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export function entryFrom(c: Comparison, meta: { opId: string; label: string; source: HistoryEntry['source'] }): HistoryEntry {
  const e = c.evm.status === 'ok' ? c.evm : null;
  const n = c.native.status === 'ok' ? c.native : null;
  return {
    id: `${c.measuredAt}-${meta.opId}`,
    at: c.measuredAt,
    opId: meta.opId,
    label: meta.label,
    source: meta.source,
    recommended: c.recommended,
    ratioAllIn: c.ratioAllIn,
    ratioFeeOnly: c.ratioVsNativeFeeOnly,
    evmPlanck: e ? e.totalPlanck.toString() : null,
    evmGasPrice: e ? e.gasPrice.toString() : null,
    evmBlock: e ? e.blockNumber : null,
    nativeFee: n ? n.partialFee.toString() : null,
    nativeDeposit: n ? n.storageDeposit.toString() : null,
    nativeBlock: n ? n.blockNumber : null,
  };
}

function isEntry(x: unknown): x is HistoryEntry {
  return !!x && typeof x === 'object' && typeof (x as HistoryEntry).at === 'string' && typeof (x as HistoryEntry).opId === 'string';
}

export function loadHistory(store: KV | null = local()): HistoryEntry[] {
  if (!store) return [];
  try {
    const raw = store.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    return Array.isArray(arr) ? arr.filter(isEntry) : [];
  } catch {
    return [];
  }
}

/** Append (chronological order), de-duplicate by id, keep the newest HISTORY_MAX. */
export function addHistory(entry: HistoryEntry, store: KV | null = local()): HistoryEntry[] {
  const all = loadHistory(store).filter((e) => e.id !== entry.id);
  all.push(entry);
  all.sort((a, b) => a.at.localeCompare(b.at));
  const trimmed = all.slice(-HISTORY_MAX);
  if (store) {
    try { store.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch { /* quota */ }
  }
  if (typeof window !== 'undefined' && store === local()) window.dispatchEvent(new Event(HISTORY_EVENT));
  return trimmed;
}

export function recordComparison(c: Comparison, meta: { opId: string; label: string; source: HistoryEntry['source'] }, store: KV | null = local()) {
  return addHistory(entryFrom(c, meta), store);
}

export function clearHistory(store: KV | null = local()) {
  if (store) { try { store.removeItem(HISTORY_KEY); } catch { /* ignore */ } }
  if (typeof window !== 'undefined' && store === local()) window.dispatchEvent(new Event(HISTORY_EVENT));
}

export type Point = { t: number; v: number };

/** Numeric series for a chart. Entries without the value are skipped, never zero-filled. */
export function seriesOf(entries: HistoryEntry[], field: 'ratioAllIn' | 'ratioFeeOnly' | 'evmGasPrice', opId?: string): Point[] {
  return entries
    .filter((e) => !opId || e.opId === opId)
    .map((e) => {
      const raw = e[field];
      const v = raw === null || raw === undefined ? NaN : Number(raw);
      return { t: Date.parse(e.at), v };
    })
    .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.t));
}
