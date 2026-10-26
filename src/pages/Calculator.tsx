import { useMemo, useState } from 'react';
import { estimateBoth, presetOps, type Comparison } from '@dualfee/sdk';
import MeasureButton from '../components/MeasureButton';
import { useNet } from '../lib/network';
import { parseCount, project } from '../lib/calculator';
import { recordComparison } from '../lib/history';
import { fmtRatio, tpot } from '../lib/format';
import CountUp from '../components/ui/CountUp';

/** Truncate (not round) to 2 dp so the animated figure always agrees with the exact bigint figure below it. */
const trunc2 = (n: number) => (Math.floor(n * 100 + 1e-9) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PRESETS = presetOps().filter((o) => o.tx.kind !== 'assetsTransfer');

export default function Calculator() {
  const net = useNet();
  const [opId, setOpId] = useState(PRESETS[0].id);
  const [countText, setCountText] = useState('10000');
  const [measured, setMeasured] = useState<Record<string, Comparison>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const d = net.config.nativeDecimals;
  const op = PRESETS.find((o) => o.id === opId)!;
  const c = measured[opId] ?? null;

  const count = useMemo(() => { try { return { n: parseCount(countText), e: null }; } catch (e) { return { n: null, e: (e as Error).message }; } }, [countText]);
  const p = c && count.n !== null ? project(c, count.n) : null;

  async function measure() {
    setBusy(true); setErr(null);
    try {
      const r = await estimateBoth(op.tx, { network: net.config, api: net.api ?? undefined });
      setMeasured((m) => ({ ...m, [opId]: r }));
      recordComparison(r, { opId: op.id, label: op.label, source: 'calculator' });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  const fmt = (v: bigint | null) => (v === null ? 'unavailable' : tpot(v, d, 2));
  const big = (v: bigint | null) => (v === null ? null : Number(v / 10n ** BigInt(Math.max(0, d - 4))) / 1e4);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="kicker">App / Calculator</span>
        <h1 className="h1">Monthly cost calculator</h1>
        <p className="text-sm text-ink-300">Pick an operation and how many you run per month. DualFee measures one live, then projects it linearly on both surfaces.</p>
      </div>
      <div className="card grid gap-4 sm:grid-cols-[1fr,12rem]">
        <div>
          <label className="label">Operation</label>
          <select className="input" value={opId} onChange={(e) => setOpId(e.target.value)}>
            {PRESETS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-ink-500">{op.detail}</p>
        </div>
        <div>
          <label className="label">Ops per month</label>
          <input className="input" inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} />
          {count.e && <p className="mt-1 text-[11px] text-red-300">{count.e}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <MeasureButton busy={busy} onClick={measure} idle={c ? 'Re-measure this op' : 'Measure this op live'} />
          {c && <span className="font-mono text-[11px] text-ink-500">per-op measured {new Date(c.measuredAt).toLocaleTimeString()}</span>}
        </div>
        {err && <p className="text-sm text-red-300 sm:col-span-2">{err}</p>}
      </div>

      {!c && <div className="card text-sm text-ink-300">Measure the op to see a projection. No number is shown until it comes from the chain.</div>}

      {p && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel">
              <div className="label">EVM · per month</div>
              <div className="num text-3xl font-semibold text-evm">{p.evm === null ? 'unavailable' : <CountUp value={big(p.evm)!} format={trunc2} />} <span className="text-sm text-ink-500">tPOT</span></div>
              <div className="mt-1 font-mono text-[11px] text-ink-500">exact {fmt(p.evm)} tPOT</div>
            </div>
            <div className="panel">
              <div className="label">Native · per month (fee + deposit)</div>
              <div className="num text-3xl font-semibold text-native">{p.nativeAllIn === null ? 'unavailable' : <CountUp value={big(p.nativeAllIn)!} format={trunc2} />} <span className="text-sm text-ink-500">tPOT</span></div>
              <div className="mt-1 font-mono text-[11px] text-ink-500">fee {fmt(p.nativeFeeOnly)} + deposit held <span className="text-deposit">{fmt(p.nativeDepositHeld)}</span></div>
            </div>
          </div>
          <div className="panel grid gap-2 sm:grid-cols-3">
            <div>
              <div className="label">Cheaper path</div>
              <div className="text-xl font-semibold">{p.cheaper === 'either' ? 'Either (within 2%)' : p.cheaper === 'evm' ? <span className="text-evm">EVM</span> : p.cheaper === 'native' ? <span className="text-native">Native</span> : '—'}</div>
            </div>
            <div>
              <div className="label">Monthly difference</div>
              <div className="num text-xl font-semibold">{p.savings === null ? '—' : `${tpot(p.savings, d, 4)} tPOT`}</div>
              <div className="font-mono text-[11px] text-ink-500">{p.savingsPct === null ? '' : `${p.savingsPct.toFixed(2)}% of the dearer path`}</div>
            </div>
            <div>
              <div className="label">Per-op ratio</div>
              <div className="num text-xl font-semibold">{fmtRatio(c!.ratioAllIn)} <span className="text-xs text-ink-500">all-in</span></div>
              <div className="font-mono text-[11px] text-ink-500">fee-only {fmtRatio(c!.ratioVsNativeFeeOnly)}</div>
            </div>
          </div>
          <p className="text-xs text-ink-500">Linear projection: assumes today's gas price, fee multiplier and storage pattern hold for every op. The storage deposit is a refundable hold, not a burned fee; an op that writes no new storage (e.g. a transfer to an existing holder) has none.</p>
        </div>
      )}
    </div>
  );
}
