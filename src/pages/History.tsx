import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../components/LineChart';
import { clearHistory, seriesOf } from '../lib/history';
import { useHistory } from '../lib/useHistory';
import { fmtRatio, tpot } from '../lib/format';
import { useNet } from '../lib/network';

export default function History() {
  const all = useHistory();
  const net = useNet();
  const [opId, setOpId] = useState<string>('');
  const ops = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of all) m.set(e.opId, e.label);
    return [...m.entries()];
  }, [all]);
  const rows = useMemo(() => all.filter((e) => !opId || e.opId === opId), [all, opId]);
  const d = net.config.nativeDecimals;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <span className="kicker">App / History</span>
          <h1 className="h1">History</h1>
          <p className="text-sm text-ink-300">Every measurement from the Fee Lab, Leaderboard and Calculator, saved in this browser's localStorage (newest 500 kept). Nothing is uploaded.</p>
        </div>
        <button className="btn-ghost" disabled={all.length === 0} onClick={() => { if (confirm(`Delete all ${all.length} saved measurements from this browser?`)) clearHistory(); }}>Clear history</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="label !mb-0">Operation</span>
        <select className="input !w-auto" value={opId} onChange={(e) => setOpId(e.target.value)}>
          <option value="">All operations ({all.length})</option>
          {ops.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      {all.length === 0 ? (
        <div className="card text-sm text-ink-300">
          No measurements yet. Run one in the <Link className="underline" to="/app/lab">Fee Lab</Link> or press <b>Re-measure live</b> on the <Link className="underline" to="/app/leaderboard">Leaderboard</Link>; it will show up here with a timestamp.
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <LineChart title="EVM ÷ native, all-in" color="#ffb547" points={seriesOf(rows, 'ratioAllIn')} format={(v) => fmtRatio(v)} />
            <LineChart title="EVM ÷ native fee only" color="#8b7bff" points={seriesOf(rows, 'ratioFeeOnly')} format={(v) => fmtRatio(v)} />
            <LineChart title="EVM gas price (wei)" color="#2fe0a6" points={seriesOf(rows, 'evmGasPrice')} format={(v) => Math.round(v).toLocaleString('en-US')} />
          </div>
          {!opId && ops.length > 1 && <p className="text-xs text-ink-500">Ratios mix different operations when "All operations" is selected; pick one op to compare like with like.</p>}
          <div className="card overflow-x-auto !p-0">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-wider text-ink-500">
                <tr className="border-b border-ink-800"><th className="px-4 py-3">When</th><th className="px-4 py-3">Operation</th><th className="px-4 py-3 text-right">EVM</th><th className="px-4 py-3 text-right">Native fee</th><th className="px-4 py-3 text-right">Deposit</th><th className="px-4 py-3 text-right">All-in</th><th className="px-4 py-3 text-right">Fee-only</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {[...rows].reverse().slice(0, 100).map((e) => (
                  <tr key={e.id} className="hover:bg-ink-850">
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-ink-300">{new Date(e.at).toLocaleString()}</td>
                    <td className="px-4 py-2.5">{e.label} <span className="font-mono text-[10px] text-ink-500">{e.source}</span></td>
                    <td className="num px-4 py-2.5 text-right text-evm">{e.evmPlanck ? tpot(BigInt(e.evmPlanck), d, 4) : '—'}</td>
                    <td className="num px-4 py-2.5 text-right text-native">{e.nativeFee ? tpot(BigInt(e.nativeFee), d, 4) : '—'}</td>
                    <td className="num px-4 py-2.5 text-right text-deposit">{e.nativeDeposit ? tpot(BigInt(e.nativeDeposit), d, 4) : '—'}</td>
                    <td className="num px-4 py-2.5 text-right">{fmtRatio(e.ratioAllIn)}</td>
                    <td className="num px-4 py-2.5 text-right text-ink-300">{fmtRatio(e.ratioFeeOnly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 100 && <p className="text-xs text-ink-500">Showing the newest 100 of {rows.length} rows; charts use all of them.</p>}
        </>
      )}
    </div>
  );
}
