import { useEffect, useState } from 'react';
import NetworkStrip from '../components/NetworkStrip';
import MeasureButton from '../components/MeasureButton';
import { networkFrom, useNetworkStatus } from '../lib/network';
import { loadCache, measureAll, saveCache, type Row } from '../lib/leaderboard';
import { ago, fmtRatio, tpot } from '../lib/format';
import { Link } from 'react-router-dom';
import { recordComparison } from '../lib/history';
import { encodeLabParams, presetToLab } from '../lib/share';

export default function Leaderboard() {
  const status = useNetworkStatus();
  const net = networkFrom(status);
  const cached = loadCache();
  const [rows, setRows] = useState<Row[]>(cached?.rows ?? []);
  const [measuredAt, setMeasuredAt] = useState<string | null>(cached?.measuredAt ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ready = status.ready;

  async function refresh() {
    setBusy(true);
    setErr(null);
    const fresh: Row[] = [];
    try {
      const all = await measureAll(net, status.api, (r) => { fresh.push(r); setRows([...fresh]); recordComparison(r.comparison, { opId: r.id, label: r.label, source: 'leaderboard' }); });
      const at = new Date().toISOString();
      saveCache(all, at);
      setMeasuredAt(at);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (ready && !cached && !busy) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="kicker">App / Leaderboard</span>
          <h1 className="h1">Leaderboard</h1>
          <p className="mt-1 text-sm text-ink-300">Common operations, measured live in your browser and cached locally.</p>
        </div>
        <div className="flex items-center gap-3">
          {measuredAt && <span className="text-xs text-ink-500">Cached {ago(measuredAt)} · {new Date(measuredAt).toLocaleString()}</span>}
          <MeasureButton busy={busy} onClick={refresh} idle="Re-measure live" busyLabel={`Measuring ${Math.min(rows.length + 1, 6)}/6…`} />
        </div>
      </div>
      <NetworkStrip s={status} />
      {err && <p className="text-sm text-red-300">{err}</p>}
      <div className="grid gap-3">
        {rows.map((r) => {
          const c = r.comparison;
          const evm = c.evm.status === 'ok' ? `${tpot(c.evm.totalPlanck, net.nativeDecimals, 4)}` : 'unavailable';
          const nat = c.native.status === 'ok' ? `${tpot(c.native.totalPlanck, net.nativeDecimals, 4)}` : 'unavailable';
          const natFee = c.native.status === 'ok' ? tpot(c.native.partialFee, net.nativeDecimals, 4) : null;
          const pick = c.recommended === 'evm' ? 'EVM' : c.recommended === 'native' ? 'Native' : c.recommended === 'either' ? 'Either' : '—';
          return (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-xs text-ink-500">{r.detail}</div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.recommended === 'evm' ? 'bg-evm-soft text-evm' : c.recommended === 'native' ? 'bg-native-soft text-native' : 'bg-ink-800 text-ink-300'}`}>{pick}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat k="EVM all-in" v={evm} unit={c.evm.status === 'ok' ? 'tPOT' : ''} tone="text-evm" />
                <Stat k="Native all-in" v={nat} unit={c.native.status === 'ok' ? 'tPOT' : ''} tone="text-native" sub={natFee !== null && c.native.status === 'ok' && c.native.storageDeposit > 0n ? `fee ${natFee} + deposit` : undefined} />
                <Stat k="Ratio all-in" v={fmtRatio(c.ratioAllIn)} />
                <Stat k="Ratio vs fee only" v={fmtRatio(c.ratioVsNativeFeeOnly)} />
              </div>
              {c.evm.status === 'ok' && c.native.status === 'ok' && (
                <DepositBar e={c.evm.totalPlanck} f={c.native.partialFee} dep={c.native.storageDeposit} />
              )}
              {presetToLab(r.id) && (
                <Link to={`/app/lab?${encodeLabParams({ ...presetToLab(r.id)!, run: true }).query}`} className="mt-3 inline-block font-mono text-[11px] text-ink-300 underline hover:text-white">reproduce in Fee Lab →</Link>
              )}
              {(c.evm.status !== 'ok' || c.native.status !== 'ok') && (
                <p className="mt-2 text-xs text-ink-500">{c.evm.status !== 'ok' ? `EVM: ${c.evm.reason}` : ''} {c.native.status !== 'ok' ? `Native: ${c.native.reason}` : ''}</p>
              )}
            </div>
          );
        })}
        {!rows.length && <div className="card text-sm text-ink-300">{ready ? 'Measuring…' : 'Connecting to both surfaces…'}</div>}
      </div>
      <p className="text-xs text-ink-500">Sample inputs are public testnet accounts and a public test token (see README). Estimates are dry-runs: nothing is signed or sent.</p>
    </div>
  );
}

function Stat({ k, v, unit, tone, sub }: { k: string; v: string; unit?: string; tone?: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="label">{k}</div>
      <div className={`font-semibold tabular-nums ${tone ?? ''}`}>{v} <span className="text-xs font-normal text-ink-500">{unit}</span></div>
      {sub && <div className="text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

/** Compact bars on a shared scale: EVM total vs native fee + deposit. */
function DepositBar({ e, f, dep }: { e: bigint; f: bigint; dep: bigint }) {
  const max = e > f + dep ? e : f + dep;
  const w = (x: bigint) => (max === 0n ? 0 : Number((x * 10000n) / max) / 100);
  return (
    <div className="mt-3 grid gap-1" aria-hidden>
      <div className="flex h-1.5 overflow-hidden rounded bg-ink-800"><div className="bg-evm" style={{ width: `${w(e)}%` }} /></div>
      <div className="flex h-1.5 overflow-hidden rounded bg-ink-800"><div className="bg-native" style={{ width: `${Math.max(f > 0n ? 0.5 : 0, w(f))}%` }} /><div className="bg-deposit" style={{ width: `${w(dep)}%` }} /></div>
    </div>
  );
}
