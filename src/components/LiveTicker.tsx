import { useNet } from '../lib/network';

/** Marquee of live values from both surfaces. Renders only what the RPCs returned. */
export default function LiveTicker() {
  const n = useNet();
  const items: { k: string; v: string; tone: string }[] = [];
  if (n.evm === null) items.push({ k: 'EVM', v: 'connecting…', tone: 'text-evm' });
  else if (!n.evm.ok) items.push({ k: 'EVM', v: 'unavailable', tone: 'text-evm' });
  else {
    items.push({ k: 'EVM block', v: `#${n.evm.block.toLocaleString('en-US')}`, tone: 'text-evm' });
    items.push({ k: 'EVM gasPrice', v: `${n.evm.gasPrice.toLocaleString('en-US')} wei`, tone: 'text-evm' });
    items.push({ k: 'EVM rtt', v: `${n.evm.latencyMs} ms`, tone: 'text-evm' });
    items.push({ k: 'chain id', v: String(n.evm.chainId), tone: 'text-evm' });
  }
  if (n.native === null) items.push({ k: 'Native', v: 'connecting…', tone: 'text-native' });
  else if (!n.native.ok) items.push({ k: 'Native', v: 'unavailable', tone: 'text-native' });
  else {
    items.push({ k: 'Native block', v: `#${n.native.block.toLocaleString('en-US')}`, tone: 'text-native' });
    if (n.native.feeMultiplier !== null) items.push({ k: 'fee multiplier', v: `${n.native.feeMultiplier.toFixed(4)}×`, tone: 'text-native' });
    items.push({ k: 'Native rtt', v: `${n.native.latencyMs} ms`, tone: 'text-native' });
    items.push({ k: 'runtime', v: `spec ${n.native.specVersion} · ${n.native.decimals}/${n.native.evmDecimals ?? '?'} dp`, tone: 'text-native' });
  }
  const row = (aria: boolean) => (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={aria}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2 whitespace-nowrap font-mono text-xs">
          <span className={`h-1.5 w-1.5 rounded-full ${it.tone === 'text-evm' ? 'bg-evm' : 'bg-native'}`} />
          <span className="uppercase tracking-wider text-ink-500">{it.k}</span>
          <span className={`tabular-nums ${it.tone}`}>{it.v}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden border-y border-ink-800 bg-ink-925/80 py-2.5 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]" aria-label="Live network values">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
