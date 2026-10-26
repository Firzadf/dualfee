import { useState } from 'react';
import { Link } from 'react-router-dom';
import { estimateBoth, presetOps, type Comparison } from '@dualfee/sdk';
import NetworkStrip from '../components/NetworkStrip';
import { networkFrom, useNetworkStatus } from '../lib/network';
import { fmtRatio, tpot } from '../lib/format';

export default function Landing() {
  const status = useNetworkStatus();
  const net = networkFrom(status);
  const [c, setC] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function remeasure() {
    setBusy(true);
    setErr(null);
    try {
      const op = presetOps().find((o) => o.id === 'deploy-erc20')!;
      setC(await estimateBoth(op.tx, { network: net }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-12">
      <section className="grid gap-5 pt-2">
        <span className="w-fit rounded-full border border-ink-700 px-3 py-1 text-xs text-ink-300">Portaldot V3 · EVM and native, one answer</span>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Same operation. Two surfaces.<br className="hidden sm:block" /> <span className="text-evm">Which</span> one is <span className="text-native">cheaper</span>?
        </h1>
        <p className="max-w-2xl text-ink-300">
          Portaldot V3 runs contracts through pallet-revive, reachable from an Ethereum JSON-RPC <em>and</em> from native Substrate extrinsics.
          DualFee asks both for a live estimate of the exact same operation and tells you which path to take, and why.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/lab" className="btn-primary">Open the Fee Lab</Link>
          <Link to="/judges" className="btn-ghost">60-second judge path</Link>
        </div>
        <NetworkStrip s={status} />
      </section>

      <section className="grid gap-4">
        <h2 className="h2">The problem</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card text-sm text-ink-300"><div className="mb-1 font-semibold text-ink-100">Two fee models</div>EVM fees come from eth_estimateGas × eth_gasPrice in 18-decimal wei. Native fees come from weight and length in 14-decimal planck, plus a separate storage deposit.</div>
          <div className="card text-sm text-ink-300"><div className="mb-1 font-semibold text-ink-100">Big headline gaps</div>A fellow Portaldot builder measured a contract deploy at about <b className="text-ink-100">289 tPOT via EVM vs 0.36 tPOT native (~800×)</b>. That is a huge routing decision if it holds.</div>
          <div className="card text-sm text-ink-300"><div className="mb-1 font-semibold text-ink-100">No tool to check</div>Wallets show one surface. Nobody shows the same op priced both ways, live, with the units reconciled.</div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="h2">Re-measuring the ~800× claim, live</h2>
            <p className="mt-1 text-sm text-ink-300">Deploy the sample ERC-20 (SampleToken.sol) both ways, right now, from your browser.</p>
          </div>
          <button className="btn-primary" onClick={remeasure} disabled={busy || !status.evm || !status.native}>{busy ? 'Measuring…' : c ? 'Measure again' : 'Measure now'}</button>
        </div>
        {err && <p className="text-sm text-red-300">{err}</p>}
        {c && (
          <div className="grid gap-3 sm:grid-cols-4">
            <Big k="EVM (gas × price)" v={c.evm.status === 'ok' ? tpot(c.evm.totalPlanck, net.nativeDecimals, 3) : 'unavailable'} tone="text-evm" />
            <Big k="Native fee only" v={c.native.status === 'ok' ? tpot(c.native.partialFee, net.nativeDecimals, 4) : 'unavailable'} tone="text-native" />
            <Big k="Native fee + deposit" v={c.native.status === 'ok' ? tpot(c.native.totalPlanck, net.nativeDecimals, 3) : 'unavailable'} tone="text-native" />
            <Big k="Ratio: fee-only → all-in" v={`${fmtRatio(c.ratioVsNativeFeeOnly)} → ${fmtRatio(c.ratioAllIn)}`} />
            <p className="text-sm text-ink-300 sm:col-span-4">
              The fee-only multiple reproduces the order of magnitude of the headline. But on pallet-revive the EVM gas figure already folds in the
              storage deposit, while the native path reports it separately (as a reserved hold). Compared all-in, the two surfaces land within a few percent.
              {' '}{c.reason}
            </p>
          </div>
        )}
        {!c && <div className="card text-sm text-ink-300">Press <b>Measure now</b>. Nothing is signed; both legs are dry-runs.</div>}
      </section>

      <section className="grid gap-4">
        <h2 className="h2">How it works</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {[
            ['Build once', 'One DualTx describes the op: native transfer, ERC-20 transfer, contract deploy, or raw calldata.'],
            ['Price on EVM', 'eth_estimateGas × eth_gasPrice on the pallet-revive RPC (chain 420420777), converted wei → planck (÷10⁴).'],
            ['Price natively', 'ReviveApi dry-run (storage deposit limit > 0) for weight + deposit, then TransactionPaymentApi.query_info for the real extrinsic.'],
            ['Compare all-in', 'Fee + storage deposit on both sides, a 2% tie band, a recommended path, and an optional on-chain record via FeeRegistry.'],
          ].map(([t, d], i) => (
            <li key={t} className="card text-sm text-ink-300"><div className="mb-1 font-semibold text-ink-100">{i + 1}. {t}</div>{d}</li>
          ))}
        </ol>
        <p className="text-xs text-ink-500">Decimals are read at runtime: chain properties (tokenDecimals) and revive.nativeToEthRatio. Anything a surface cannot estimate is shown as “unavailable” with the reason.</p>
      </section>
    </div>
  );
}

function Big({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="card">
      <div className="label">{k}</div>
      <div className={`text-xl font-semibold tabular-nums ${tone ?? ''}`}>{v}</div>
    </div>
  );
}
