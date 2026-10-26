import { useNet, type NetStatus } from '../lib/network';
import Spinner from './ui/Spinner';

function Dot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <Spinner className="h-3 w-3 shrink-0 text-ink-500" />;
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-native opacity-40" />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${ok ? 'bg-native' : 'bg-red-400'}`} />
    </span>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-500">{k}</div>
      <div className="num truncate text-[13px] text-ink-100">{v}</div>
    </div>
  );
}

/** Live per-surface status: block height, gas price / fee multiplier, latency. */
export default function NetworkStrip({ s: override, compact = false }: { s?: NetStatus; compact?: boolean }) {
  const net = useNet();
  const s = override ?? net;
  const evm = s.evm;
  const nat = s.native;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-ink-800 bg-ink-900/80 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <Dot ok={evm ? evm.ok : null} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-evm">EVM · eth RPC</span>
          <span className="ml-auto font-mono text-[10px] text-ink-500">{!evm ? 'connecting…' : evm.ok ? `chain ${evm.chainId}` : 'unavailable'}</span>
        </div>
        {evm && evm.ok ? (
          <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-3'}`}>
            <Cell k="block" v={`#${evm.block.toLocaleString('en-US')}`} />
            <Cell k="gas price" v={`${evm.gasPrice.toLocaleString('en-US')} wei`} />
            <Cell k="latency" v={`${evm.latencyMs} ms`} />
          </div>
        ) : (
          <p className="font-mono text-[11px] text-ink-300">{!evm ? 'Handshaking with test-evm-rpc-v3.portaldot.dev…' : `${evm.error}`}</p>
        )}
      </div>
      <div className="rounded-xl border border-ink-800 bg-ink-900/80 px-3 py-2.5">
        <div className="mb-2 flex items-center gap-2">
          <Dot ok={nat ? nat.ok : null} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-native">Native · Substrate WSS</span>
          <span className="ml-auto truncate font-mono text-[10px] text-ink-500">{!nat ? 'connecting…' : nat.ok ? `spec ${nat.specVersion} · ${nat.decimals} dp` : 'unavailable'}</span>
        </div>
        {nat && nat.ok ? (
          <div className="grid grid-cols-3 gap-3">
            <Cell k="block" v={`#${nat.block.toLocaleString('en-US')}`} />
            <Cell k="fee mult." v={nat.feeMultiplier === null ? 'n/a' : `${nat.feeMultiplier.toFixed(4)}×`} />
            <Cell k="latency" v={`${nat.latencyMs} ms`} />
          </div>
        ) : (
          <p className="font-mono text-[11px] text-ink-300">{!nat ? 'Opening WebSocket + fetching runtime metadata (cold start can take ~5s)…' : `${nat.error}`}</p>
        )}
      </div>
    </div>
  );
}
