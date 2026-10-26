import { useEffect, useState } from 'react';
import { FeeRegistryBytecode, PORTALDOT_V3, comparisonHash, encodeRecord, estimateBoth, evmRpc, functionSelector, hexToBigInt, isH160, opTypeOf, presetOps, type Comparison } from '@dualfee/sdk';
import { connect, injected, sendTx, waitReceipt } from '../lib/wallet';
import { networkFrom, useNetworkStatus } from '../lib/network';
import { short, tpot } from '../lib/format';

const REG_KEY = 'dualfee.registry';
type Log = { label: string; hash: string; status?: string; extra?: string };

export default function Deploy() {
  const status = useNetworkStatus();
  const net = networkFrom(status);
  const [account, setAccount] = useState<string | null>(null);
  const [registry, setRegistry] = useState<string>(() => localStorage.getItem(REG_KEY) ?? '');
  const [count, setCount] = useState<bigint | null>(null);
  const [opId, setOpId] = useState('deploy-erc20');
  const [cmp, setCmp] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const ops = presetOps();

  useEffect(() => {
    if (isH160(registry)) localStorage.setItem(REG_KEY, registry);
    void readCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registry]);

  async function readCount() {
    if (!isH160(registry)) return setCount(null);
    try {
      const r = await evmRpc<string>(PORTALDOT_V3.evmRpc, 'eth_call', [{ to: registry, data: functionSelector('count()') }, 'latest']);
      setCount(hexToBigInt(r));
    } catch {
      setCount(null);
    }
  }

  async function guard<T>(label: string, f: () => Promise<T>) {
    setBusy(label);
    setErr(null);
    try { return await f(); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  const doConnect = () => guard('Connecting…', async () => setAccount(await connect()));

  const doDeploy = () => guard('Deploying FeeRegistry…', async () => {
    const hash = await sendTx(account!, { data: FeeRegistryBytecode });
    setLogs((l) => [{ label: 'Deploy FeeRegistry', hash }, ...l]);
    const r = await waitReceipt(hash);
    setLogs((l) => l.map((x) => (x.hash === hash ? { ...x, status: r ? (r.status === '0x1' ? 'success' : 'failed') : 'pending (timeout)', extra: r?.contractAddress ?? undefined } : x)));
    if (r?.contractAddress) setRegistry(r.contractAddress);
  });

  const doMeasure = () => guard('Measuring both surfaces…', async () => {
    const op = ops.find((o) => o.id === opId)!;
    setCmp(await estimateBoth(op.tx, { network: net, api: status.api ?? undefined }));
  });

  const doRecord = () => guard('Recording…', async () => {
    const op = ops.find((o) => o.id === opId)!;
    const c = cmp!;
    const evmWei = c.evm.status === 'ok' ? c.evm.feeWei : 0n;
    const nativePlanck = c.native.status === 'ok' ? c.native.totalPlanck : 0n;
    const h = comparisonHash(c);
    const hash = await sendTx(account!, { to: registry, data: encodeRecord(h, opTypeOf(op.tx.kind), evmWei, nativePlanck) });
    setLogs((l) => [{ label: `record(${op.id})`, hash, extra: `comparisonHash ${short(h, 8)}` }, ...l]);
    const r = await waitReceipt(hash);
    setLogs((l) => l.map((x) => (x.hash === hash ? { ...x, status: r ? (r.status === '0x1' ? 'success' : 'failed') : 'pending (timeout)' } : x)));
    await readCount();
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Deploy & record</h1>
        <p className="mt-1 text-sm text-ink-300">Optional. Deploy <span className="mono">FeeRegistry.sol</span> with your own injected wallet and write a comparison on-chain. DualFee holds no keys; your wallet signs and pays.</p>
      </div>

      <div className="card grid gap-3">
        <div className="label">1 · Wallet</div>
        {account ? <div className="mono text-sm">{account}</div> : <button className="btn-primary w-fit" onClick={doConnect} disabled={!!busy}>{injected() ? 'Connect wallet' : 'No injected wallet detected'}</button>}
        <p className="text-xs text-ink-500">Adds/switches to chain {PORTALDOT_V3.chainId} ({PORTALDOT_V3.chainIdHex}), RPC {PORTALDOT_V3.evmRpc}.</p>
      </div>

      <div className="card grid gap-3">
        <div className="label">2 · Registry</div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="input" placeholder="0x… existing FeeRegistry address, or deploy one" value={registry} onChange={(e) => setRegistry(e.target.value.trim())} />
          <button className="btn-ghost shrink-0" onClick={doDeploy} disabled={!account || !!busy}>Deploy new</button>
        </div>
        {isH160(registry) && <p className="text-xs text-ink-300">count() = {count === null ? 'unreadable (no contract here?)' : count.toString()}</p>}
      </div>

      <div className="card grid gap-3">
        <div className="label">3 · Measure and record</div>
        <select className="input" value={opId} onChange={(e) => { setOpId(e.target.value); setCmp(null); }}>
          {ops.filter((o) => o.tx.kind !== 'assetsTransfer').map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div className="flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={doMeasure} disabled={!!busy}>Measure</button>
          <button className="btn-primary" onClick={doRecord} disabled={!account || !cmp || !isH160(registry) || !!busy}>Record on-chain</button>
        </div>
        {cmp && (
          <p className="text-xs text-ink-300">
            EVM {cmp.evm.status === 'ok' ? `${cmp.evm.feeWei} wei` : 'unavailable'} · native {cmp.native.status === 'ok' ? `${cmp.native.totalPlanck} planck (${tpot(cmp.native.totalPlanck, net.nativeDecimals, 4)} tPOT)` : 'unavailable'} · hash {short(comparisonHash(cmp), 8)}
          </p>
        )}
      </div>

      {busy && <p className="text-sm text-ink-300">{busy}</p>}
      {err && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</p>}

      {logs.length > 0 && (
        <div className="card grid gap-2">
          <div className="label">Transactions</div>
          {logs.map((l) => (
            <div key={l.hash} className="grid gap-0.5 border-t border-ink-800 pt-2 text-sm first:border-0 first:pt-0">
              <div className="font-semibold">{l.label} <span className="font-normal text-ink-500">· {l.status ?? 'submitted'}</span></div>
              <div className="mono text-xs text-ink-300">tx {l.hash}</div>
              {l.extra && <div className="mono text-xs text-ink-300">{l.extra}</div>}
            </div>
          ))}
          <p className="text-xs text-ink-500">Tx hashes come from your wallet and the EVM RPC. Portaldot's official explorers are Substrate-side, so DualFee does not build an EVM explorer link.</p>
        </div>
      )}
    </div>
  );
}
