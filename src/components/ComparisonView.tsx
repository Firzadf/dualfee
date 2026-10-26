import type { Comparison, NetworkConfig } from '@dualfee/sdk';
import { fmtRatio, tpot } from '../lib/format';

function Leg({ side, c, net }: { side: 'evm' | 'native'; c: Comparison; net: NetworkConfig }) {
  const winner = c.recommended === side;
  const color = side === 'evm' ? 'text-evm' : 'text-native';
  const ring = winner ? (side === 'evm' ? 'border-evm' : 'border-native') : 'border-ink-700';
  const d = net.nativeDecimals;
  return (
    <div className={`rounded-2xl border ${ring} bg-ink-900 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold ${color}`}>{side === 'evm' ? 'EVM surface' : 'Native surface'}</span>
        {winner && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${side === 'evm' ? 'bg-evm-soft text-evm' : 'bg-native-soft text-native'}`}>cheaper</span>}
      </div>
      {side === 'evm' ? (
        c.evm.status === 'ok' ? (
          <>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{tpot(c.evm.totalPlanck, d)} <span className="text-sm text-ink-300">tPOT</span></div>
            <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs text-ink-300">
              <dt>method</dt><dd className="mono text-ink-100">{c.evm.method}</dd>
              <dt>gas</dt><dd className="mono text-ink-100">{c.evm.gas.toString()}</dd>
              <dt>gasPrice</dt><dd className="mono text-ink-100">{c.evm.gasPrice.toString()} wei</dd>
              <dt>fee</dt><dd className="mono text-ink-100">{c.evm.feeWei.toString()} wei</dd>
              <dt>block</dt><dd className="mono text-ink-100">#{c.evm.blockNumber}</dd>
            </dl>
          </>
        ) : (
          <Unavailable method={c.evm.method} reason={c.evm.reason} />
        )
      ) : c.native.status === 'ok' ? (
        <>
          <div className="mt-2 text-2xl font-semibold tabular-nums">{tpot(c.native.totalPlanck, d)} <span className="text-sm text-ink-300">tPOT</span></div>
          <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs text-ink-300">
            <dt>method</dt><dd className="mono text-ink-100">{c.native.method}</dd>
            <dt>partialFee</dt><dd className="mono text-ink-100">{tpot(c.native.partialFee, d, 8)} tPOT</dd>
            <dt>storage dep.</dt><dd className="mono text-ink-100">{tpot(c.native.storageDeposit, d, 8)} tPOT</dd>
            <dt>weight</dt><dd className="mono text-ink-100">{c.native.weight.refTime.toString()} / {c.native.weight.proofSize.toString()}</dd>
            <dt>block</dt><dd className="mono text-ink-100">#{c.native.blockNumber}</dd>
          </dl>
        </>
      ) : (
        <Unavailable method={c.native.method} reason={c.native.reason} />
      )}
    </div>
  );
}

function Unavailable({ method, reason }: { method: string; reason: string }) {
  return (
    <div className="mt-2">
      <div className="text-2xl font-semibold text-ink-500">unavailable</div>
      <p className="mt-2 text-xs text-ink-300"><span className="mono">{method}</span>: {reason}</p>
    </div>
  );
}

export default function ComparisonView({ c, net }: { c: Comparison; net: NetworkConfig }) {
  const rec = c.recommended === 'evm' ? 'EVM' : c.recommended === 'native' ? 'Native' : c.recommended === 'either' ? 'Either (tie)' : 'No recommendation';
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Leg side="evm" c={c} net={net} />
        <Leg side="native" c={c} net={net} />
      </div>
      <div className="card grid gap-3 sm:grid-cols-3">
        <div>
          <div className="label">Recommended path</div>
          <div className="text-lg font-semibold">{rec}</div>
        </div>
        <div>
          <div className="label">EVM ÷ native, all-in</div>
          <div className="text-lg font-semibold tabular-nums">{fmtRatio(c.ratioAllIn)}</div>
          <div className="text-[11px] text-ink-500">native fee + storage deposit</div>
        </div>
        <div>
          <div className="label">EVM ÷ native fee only</div>
          <div className="text-lg font-semibold tabular-nums">{fmtRatio(c.ratioVsNativeFeeOnly)}</div>
          <div className="text-[11px] text-ink-500">how headline multiples are usually measured</div>
        </div>
        <p className="text-xs text-ink-300 sm:col-span-3">{c.reason} Measured {new Date(c.measuredAt).toLocaleString()}.</p>
      </div>
    </div>
  );
}
