import Splash from './Splash';
import { useNet } from '../lib/network';

/** Splash wired to the shared network: shows both handshakes live and may leave early once both answer. */
export default function SplashGate() {
  const net = useNet();
  const line = (label: string, st: { ok: boolean } | null) => (
    <span className="block">
      {label} {st === null ? '· handshaking…' : st.ok ? '· ok' : '· unavailable'}
    </span>
  );
  return <Splash ready={net.ready} status={<>{line('EVM rpc', net.evm)}{line('Native wss', net.native)}</>} />;
}
