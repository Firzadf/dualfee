import { useMemo, useState } from 'react';
import { accountId32ToH160, h160ToAccountId32, h160ToSs58, isEthDerived, isH160, PORTALDOT_V3 } from '@dualfee/sdk';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import CopyButton from '../components/ui/CopyButton';

type Out = { k: string; v: string; note?: string }[];

function convert(input: string, ss58: number): { kind: string; out: Out } | { error: string } {
  const v = input.trim();
  if (!v) return { error: '' };
  try {
    if (isH160(v)) {
      return {
        kind: 'EVM address (H160)',
        out: [
          { k: 'H160 (checksum-free, lowercase)', v: v.toLowerCase() },
          { k: 'AccountId32 (fallback: h160 ++ 0xEE×12)', v: h160ToAccountId32(v) },
          { k: `SS58 (prefix ${ss58})`, v: h160ToSs58(v, ss58), note: 'The native account that EVM-origin calls from this address act as, unless a native account has mapped itself to this H160.' },
        ],
      };
    }
    if (/^0x[0-9a-fA-F]{64}$/.test(v) || !v.startsWith('0x')) {
      const bytes = v.startsWith('0x') ? null : decodeAddress(v); // throws on a bad SS58 checksum
      const hex = bytes ? u8aToHex(bytes) : v.toLowerCase();
      if (hex.length !== 66) throw new Error('AccountId32 must be 32 bytes');
      const eth = isEthDerived(hex);
      return {
        kind: bytes ? 'Native SS58 address' : 'AccountId32 (hex)',
        out: [
          { k: 'AccountId32 (hex)', v: hex },
          { k: `SS58 (prefix ${ss58})`, v: encodeAddress(hex, ss58) },
          { k: 'H160 (EVM)', v: accountId32ToH160(hex), note: eth ? 'Ethereum-derived account (ends in 0xEE×12): the H160 is its first 20 bytes.' : 'Native account: H160 = last 20 bytes of keccak256(AccountId32). It must call revive.map_account before EVM-side calls resolve back to it.' },
        ],
      };
    }
    return { error: 'Enter a 0x… H160 (40 hex), a 0x… AccountId32 (64 hex), or an SS58 address.' };
  } catch (e) {
    return { error: e instanceof Error ? `Invalid address: ${e.message}` : 'Invalid address' };
  }
}

export default function Convert() {
  const [input, setInput] = useState('0x03c502abb79e8eee50135c91933d059d982dd912');
  const [ss58, setSs58] = useState<number>(PORTALDOT_V3.ss58Format);
  const r = useMemo(() => convert(input, ss58), [input, ss58]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="kicker">App / Address converter</span>
        <h1 className="h1">Address converter</h1>
        <p className="text-sm text-ink-300">pallet-revive maps every EVM address to a native account and back. Paste either side; conversion runs locally with the same SDK helpers the fee engine uses (mapping verified against the live <span className="mono">ReviveApi.address</span>).</p>
      </div>
      <div className="card grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[1fr,8rem]">
          <div>
            <label className="label" htmlFor="addr">EVM 0x… or native SS58 / AccountId32</label>
            <input id="addr" className={`input ${'error' in r && r.error ? '!border-red-400/60' : ''}`} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" />
          </div>
          <div>
            <label className="label" htmlFor="pfx">SS58 prefix</label>
            <input id="pfx" className="input" inputMode="numeric" value={ss58} onChange={(e) => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 0 && n < 16384) setSs58(n); }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="text-ink-500">try:</span>
          <button className="chip" onClick={() => setInput('0x03c502abb79e8eee50135c91933d059d982dd912')}>EVM sample</button>
          <button className="chip" onClick={() => setInput('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')}>native (Alice)</button>
        </div>
        {'error' in r ? (
          r.error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{r.error}</p>
        ) : (
          <div className="grid gap-3">
            <span className="chip w-fit">detected: {r.kind}</span>
            {r.out.map((o) => (
              <div key={o.k} className="grid gap-1.5 rounded-xl border border-ink-800 bg-ink-950 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="label !mb-0">{o.k}</span>
                  <CopyButton text={o.v} />
                </div>
                <code className="mono text-sm text-ink-100">{o.v}</code>
                {o.note && <p className="text-[11px] text-ink-500">{o.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
