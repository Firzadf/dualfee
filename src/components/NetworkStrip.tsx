import type { NetStatus } from '../lib/network';

function Dot({ ok }: { ok: boolean | null }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${ok === null ? 'animate-pulse bg-ink-500' : ok ? 'bg-native' : 'bg-red-400'}`} />;
}

export default function NetworkStrip({ s }: { s: NetStatus }) {
  return (
    <div className="grid gap-2 text-xs sm:grid-cols-2">
      <div className="flex items-start gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2">
        <Dot ok={s.evm ? s.evm.ok : null} />
        <div className="min-w-0">
          <div className="font-semibold text-evm">EVM · pallet-revive eth RPC</div>
          <div className="text-ink-300">
            {!s.evm ? 'connecting…' : s.evm.ok ? `chain ${s.evm.chainId} · block #${s.evm.block.toLocaleString('en-US')} · gasPrice ${s.evm.gasPrice} wei` : `unavailable: ${s.evm.error}`}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-xl border border-ink-800 bg-ink-900 px-3 py-2">
        <Dot ok={s.native ? s.native.ok : null} />
        <div className="min-w-0">
          <div className="font-semibold text-native">Native · Substrate WSS</div>
          <div className="text-ink-300">
            {!s.native
              ? 'connecting…'
              : s.native.ok
                ? `${s.native.chain} spec ${s.native.specVersion} · #${s.native.block.toLocaleString('en-US')} · ${s.native.symbol} ${s.native.decimals} dp (EVM ${s.native.evmDecimals ?? '?'} dp)`
                : `unavailable: ${s.native.error}`}
          </div>
        </div>
      </div>
    </div>
  );
}
