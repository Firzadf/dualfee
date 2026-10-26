import { motion, useReducedMotion } from 'framer-motion';
import type { Comparison } from '@dualfee/sdk';
import { fmtRatio, tpot } from '../lib/format';
import { EASE } from '../lib/motion';
import { useNet } from '../lib/network';

function frac(x: bigint, max: bigint): number {
  if (max === 0n) return 0;
  return Number((x * 1_000_000n) / max) / 1_000_000;
}

function Bar({ parts, label, total, d }: { parts: { v: bigint; cls: string; name: string; w: number }[]; label: string; total: bigint; d: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-ink-300">{label}</span>
        <span className="num text-sm text-ink-100">{tpot(total, d, 4)} <span className="text-ink-500">tPOT</span></span>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-md bg-ink-800/70" role="img" aria-label={`${label}: ${parts.map((p) => `${p.name} ${tpot(p.v, d, 6)} tPOT`).join(', ')}`}>
        {parts.map((p, i) => (
          <motion.div
            key={p.name}
            className={`${p.cls} h-full origin-left`}
            style={{ width: `${Math.max(p.v > 0n ? 0.4 : 0, p.w * 100)}%` }}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.25 }}
            title={`${p.name}: ${tpot(p.v, d, 8)} tPOT`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Stacked bars for one live comparison: EVM gas cost vs native fee alone vs native fee + storage deposit.
 * Widths share one linear scale, so the tiny native fee is drawn as tiny as it really is.
 */
export default function FeeBreakdown({ c, decimals = 14, showExplain = true }: { c: Comparison; decimals?: number; showExplain?: boolean }) {
  const net = useNet();
  if (c.evm.status !== 'ok' || c.native.status !== 'ok') {
    return <p className="text-sm text-ink-300">Breakdown needs both surfaces. {c.evm.status !== 'ok' ? `EVM: ${c.evm.reason}. ` : ''}{c.native.status !== 'ok' ? `Native: ${c.native.reason}.` : ''}</p>;
  }
  const e = c.evm.totalPlanck;
  const fee = c.native.partialFee;
  const dep = c.native.storageDeposit;
  const max = [e, fee + dep].reduce((a, b) => (a > b ? a : b), 0n);
  const depShare = fee + dep === 0n ? 0 : frac(dep, fee + dep);
  const nat = net.native && net.native.ok ? net.native : null;
  const mk = (v: bigint, cls: string, name: string) => ({ v, cls, name, w: frac(v, max) });
  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <Bar label="EVM · gas × gasPrice" total={e} d={decimals} parts={[mk(e, 'bg-evm', 'EVM gas cost')]} />
        <Bar label="Native · partialFee only (the headline denominator)" total={fee} d={decimals} parts={[mk(fee, 'bg-native', 'native fee')]} />
        <Bar label="Native · fee + storage deposit (all-in)" total={fee + dep} d={decimals} parts={[mk(fee, 'bg-native', 'native fee'), mk(dep, 'bg-deposit', 'storage deposit')]} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-300">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-evm" />EVM gas</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-native" />native fee</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-deposit" />storage deposit (reserved, refundable)</span>
        <span className="ml-auto">fee-only {fmtRatio(c.ratioVsNativeFeeOnly)} → all-in {fmtRatio(c.ratioAllIn)}</span>
      </div>
      {showExplain && (
        <p className="text-sm text-ink-300">
          {dep > 0n ? (
            <>The storage deposit is <b className="text-deposit">{(depShare * 100).toFixed(1)}%</b> of the native all-in cost here. </>
          ) : (
            <>This op adds no new storage, so the native side has no deposit and the comparison is fee vs fee. </>
          )}
          pallet-revive charges a deposit for every byte and item a call leaves in state
          {nat && nat.depositPerByte !== null && nat.depositPerItem !== null && (
            <> (live: <span className="num text-ink-100">{tpot(nat.depositPerByte, decimals, 4)}</span> tPOT/byte, <span className="num text-ink-100">{tpot(nat.depositPerItem, decimals, 4)}</span> tPOT/item)</>
          )}
          . A deploy stores the whole contract code, so the deposit dwarfs the weight fee. The EVM gas estimate already folds that deposit in; the native path reports it separately as a hold.
        </p>
      )}
    </div>
  );
}
