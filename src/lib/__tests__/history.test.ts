import { describe, expect, it } from 'vitest';
import { addHistory, clearHistory, entryFrom, loadHistory, seriesOf, HISTORY_MAX, type KV } from '../history';
import { deployCmp, evmDown, transferCmp } from './fixtures';

function mem(): KV {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('history', () => {
  it('stores entries as JSON with bigint strings and keeps chronological order', () => {
    const s = mem();
    addHistory(entryFrom(transferCmp, { opId: 't', label: 'T', source: 'lab' }), s);
    addHistory(entryFrom(deployCmp, { opId: 'd', label: 'D', source: 'lab' }), s);
    const h = loadHistory(s);
    expect(h.map((e) => e.opId)).toEqual(['d', 't']);
    expect(h[0].nativeDeposit).toBe('12203700000000000');
  });
  it('caps at HISTORY_MAX and clears', () => {
    const s = mem();
    for (let i = 0; i < HISTORY_MAX + 5; i++) {
      const e = entryFrom(transferCmp, { opId: 't', label: 'T', source: 'lab' });
      addHistory({ ...e, id: String(i), at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString() }, s);
    }
    expect(loadHistory(s)).toHaveLength(HISTORY_MAX);
    clearHistory(s);
    expect(loadHistory(s)).toEqual([]);
  });
  it('series skip missing values instead of zero-filling', () => {
    const s = mem();
    addHistory(entryFrom(evmDown, { opId: 'x', label: 'X', source: 'lab' }), s);
    addHistory(entryFrom(deployCmp, { opId: 'x', label: 'X', source: 'lab' }), s);
    const pts = seriesOf(loadHistory(s), 'ratioAllIn', 'x');
    expect(pts).toHaveLength(1);
    expect(pts[0].v).toBeCloseTo(deployCmp.ratioAllIn!, 6);
  });
});
