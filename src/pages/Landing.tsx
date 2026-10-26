import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { estimateBoth, presetOps, type Comparison } from '@dualfee/sdk';
import Hero from '../components/Hero';
import LiveTicker from '../components/LiveTicker';
import NetworkStrip from '../components/NetworkStrip';
import MeasureButton from '../components/MeasureButton';
import FeeBreakdown from '../components/FeeBreakdown';
import Reveal from '../components/ui/Reveal';
import CountUp from '../components/ui/CountUp';
import { useNet } from '../lib/network';
import { fmtRatio, tpot } from '../lib/format';
import { FEATURES } from '../lib/features';
import { recordComparison } from '../lib/history';

function Section({ n, title, kicker, children }: { n: string; title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6">
      <Reveal className="grid gap-2">
        <span className="kicker">§ {n} / {kicker}</span>
        <h2 className="h2 max-w-3xl">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}

export default function Landing() {
  const net = useNet();
  const [c, setC] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const auto = useRef(false);

  async function remeasure() {
    setBusy(true);
    setErr(null);
    try {
      const op = presetOps().find((o) => o.id === 'deploy-erc20')!;
      const r = await estimateBoth(op.tx, { network: net.config, api: net.api ?? undefined });
      setC(r);
      recordComparison(r, { opId: op.id, label: op.label, source: 'landing' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  // Measure the sample deploy once, as soon as both surfaces answer: the hero and the bar show live data, never placeholders.
  useEffect(() => {
    if (net.ready && !auto.current) { auto.current = true; void remeasure(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net.ready]);

  const d = net.config.nativeDecimals;
  const ok = c && c.evm.status === 'ok' && c.native.status === 'ok' ? c : null;

  return (
    <div className="grid gap-20 sm:gap-28">
      <div className="grid gap-8">
        <Hero c={c} busy={busy || !net.ready} />
        <div className="-mx-4 sm:mx-0"><LiveTicker /></div>
      </div>

      <Section n="01" kicker="Problem" title="Two fee models price the same contract call. Nobody shows both.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['Two units', 'EVM fees are eth_estimateGas × eth_gasPrice in 18-decimal wei. Native fees come from weight + length in 14-decimal planck, plus a separate storage deposit.'],
            ['A big headline', 'A fellow Portaldot builder measured a contract deploy at about 289 tPOT via EVM vs 0.36 tPOT native, ~800×. That would decide every deploy, if it holds.'],
            ['No tool to check', 'Wallets show one surface. DualFee prices the same op on both, live, with the units reconciled and the deposit made visible.'],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.06} className="panel">
              <div className="kicker mb-2">0{i + 1}</div>
              <div className="mb-1 font-display text-lg font-semibold">{t}</div>
              <p className="text-sm text-ink-300">{b}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section n="02" kicker="Myth vs reality" title="The ~800× is fee-only. All-in, deploys land within a few percent.">
        <Reveal className="panel grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-xl text-sm text-ink-300">Deploying the sample ERC-20 (SampleToken.sol) both ways, right now, from your browser. Dry-runs only: nothing is signed.</p>
            <MeasureButton busy={busy} onClick={remeasure} idle={c ? 'Measure again' : 'Measure now'} />
          </div>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {ok && ok.evm.status === 'ok' && ok.native.status === 'ok' ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat k="EVM gas × price" tone="text-evm" v={tpot(ok.evm.totalPlanck, d, 3)} u="tPOT" />
                <Stat k="Native fee only" tone="text-native" v={tpot(ok.native.partialFee, d, 4)} u="tPOT" />
                <div className="panel !p-4">
                  <div className="label">Fee-only ratio</div>
                  <CountUp className="num text-2xl font-semibold text-ink-100" value={ok.ratioVsNativeFeeOnly ?? 0} format={(n) => fmtRatio(n)} />
                </div>
                <div className="panel !p-4">
                  <div className="label">All-in ratio</div>
                  <CountUp className="num text-2xl font-semibold text-deposit" value={ok.ratioAllIn ?? 0} format={(n) => fmtRatio(n)} />
                </div>
              </div>
              <FeeBreakdown c={ok} decimals={d} />
              <p className="font-mono text-[11px] text-ink-500">{ok.reason} · measured {new Date(ok.measuredAt).toLocaleString()} · EVM block #{ok.evm.blockNumber} · native block #{ok.native.blockNumber}</p>
            </>
          ) : c ? (
            <FeeBreakdown c={c} decimals={d} />
          ) : (
            <div className="grid gap-3">
              <div className="h-4 w-full animate-pulse rounded-md bg-ink-800" />
              <div className="h-4 w-1/3 animate-pulse rounded-md bg-ink-800" />
              <div className="h-4 w-full animate-pulse rounded-md bg-ink-800" />
              <p className="font-mono text-[11px] text-ink-500">{net.ready ? 'Measuring live…' : 'Waiting for both surfaces to answer…'} No placeholder numbers are shown.</p>
            </div>
          )}
        </Reveal>
      </Section>

      <Section n="03" kicker="How it works" title="One op description, two live estimates, one comparison.">
        <ol className="grid gap-3 md:grid-cols-4">
          {[
            ['Describe once', 'One DualTx: native transfer, ERC-20 transfer, contract deploy or raw calldata.'],
            ['Price on EVM', 'eth_estimateGas × eth_gasPrice on the pallet-revive RPC (chain 420420777), wei → planck ÷ 10⁴.'],
            ['Price natively', 'ReviveApi dry-run (deposit limit > 0) for weight + deposit, then TransactionPaymentApi.query_info.'],
            ['Compare all-in', 'Fee + deposit on both sides, 2% tie band, a recommended path, optional on-chain record.'],
          ].map(([t, b], i) => (
            <Reveal key={t} delay={i * 0.06} className="panel">
              <div className="num mb-3 text-3xl text-ink-600">{String(i + 1).padStart(2, '0')}</div>
              <div className="mb-1 font-semibold">{t}</div>
              <p className="text-sm text-ink-300">{b}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal><NetworkStrip /></Reveal>
      </Section>

      <Section n="04" kicker="Features" title="An instrument, not a demo.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.to} delay={(i % 3) * 0.05}>
              <Link to={f.to} className="panel group block h-full transition hover:border-ink-600">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{f.title}</span>
                  <span className="font-mono text-xs text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-ink-100">{f.to} →</span>
                </div>
                <p className="text-sm text-ink-300">{f.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <Reveal className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-900 p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-native/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-evm/20 blur-3xl" />
        <div className="relative grid gap-4">
          <span className="kicker">§ 05 / Try it</span>
          <h2 className="h2 max-w-2xl">Price your own op on both surfaces in under a minute.</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/app/lab" className="btn-primary">Open the Fee Lab</Link>
            <Link to="/docs" className="btn-ghost">Read the methodology</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Stat({ k, v, u, tone }: { k: string; v: string; u: string; tone: string }) {
  return (
    <div className="panel !p-4">
      <div className="label">{k}</div>
      <div className={`num text-2xl font-semibold ${tone}`}>{v} <span className="text-xs text-ink-500">{u}</span></div>
    </div>
  );
}
