import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Comparison } from '@dualfee/sdk';
import { EASE } from '../lib/motion';
import { fmtRatio } from '../lib/format';

const EVM_PATH = 'M 0 70 C 180 70, 220 150, 420 150';
const NAT_PATH = 'M 0 230 C 180 230, 220 150, 420 150';
const OUT_PATH = 'M 420 150 L 800 150';

function answerText(c: Comparison | null, busy: boolean): { top: string; bottom: string } {
  if (!c) return { top: busy ? 'measuring…' : 'one answer', bottom: busy ? 'deploy · both surfaces' : 'waiting for both surfaces' };
  const r = c.recommended;
  const top = r === 'either' ? 'tie · pick by UX' : r === 'evm' ? 'route: EVM' : r === 'native' ? 'route: Native' : 'no answer';
  return { top, bottom: `all-in ${fmtRatio(c.ratioAllIn)} · fee-only ${fmtRatio(c.ratioVsNativeFeeOnly)}` };
}

/** Two surfaces flow in, converge, and leave as one live answer (the sample deploy, measured on load). */
export default function Hero({ c, busy }: { c: Comparison | null; busy: boolean }) {
  const reduce = useReducedMotion();
  const a = answerText(c, busy);
  const draw = (delay: number) => (reduce ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.2, ease: EASE, delay } });
  return (
    <section className="relative grid gap-8 pt-6 sm:pt-12">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[min(90vw,48rem)] -translate-x-1/2 rounded-full bg-gradient-to-r from-evm/25 via-deposit/10 to-native/25 blur-3xl" />
      <motion.div className="relative grid gap-5" initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
        <span className="chip w-fit"><span className="h-1.5 w-1.5 rounded-full bg-deposit" /> Portaldot V3 testnet · live, read-only</span>
        <h1 className="max-w-3xl font-display text-[2.4rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl">
          Same op. <span className="text-evm">Two</span> <span className="text-native">surfaces.</span><br />One honest answer.
        </h1>
        <p className="max-w-2xl text-base text-ink-300 sm:text-lg">
          Portaldot V3 runs contracts through pallet-revive, reachable from an Ethereum RPC <em>and</em> from native Substrate extrinsics.
          DualFee prices the exact same operation on both, live from your browser, and shows why the famous ~800× gap is mostly a storage deposit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/lab" className="btn-primary">Open the Fee Lab →</Link>
          <Link to="/judges" className="btn-ghost">60-second judge path</Link>
        </div>
      </motion.div>

      <div className="relative -mx-4 overflow-hidden sm:mx-0">
        <svg viewBox="0 0 800 300" className="h-auto w-full" role="img" aria-label="EVM and native estimates converge into one recommendation">
          <defs>
            <linearGradient id="g-out" x1="0" x2="1">
              <stop offset="0" stopColor="#ffb547" />
              <stop offset="1" stopColor="#e8ebf2" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d={EVM_PATH} stroke="#8b7bff" strokeOpacity="0.15" strokeWidth="10" fill="none" />
          <path d={NAT_PATH} stroke="#2fe0a6" strokeOpacity="0.15" strokeWidth="10" fill="none" />
          <motion.path d={EVM_PATH} stroke="#8b7bff" strokeWidth="2.5" fill="none" {...draw(0.2)} />
          <motion.path d={NAT_PATH} stroke="#2fe0a6" strokeWidth="2.5" fill="none" {...draw(0.35)} />
          <motion.path d={OUT_PATH} stroke="url(#g-out)" strokeWidth="2.5" fill="none" strokeDasharray="6 8" {...draw(1.2)} />
          {!reduce && (
            <>
              <circle r="5" fill="#8b7bff"><animateMotion dur="3.2s" repeatCount="indefinite" path={EVM_PATH} /></circle>
              <circle r="5" fill="#2fe0a6"><animateMotion dur="3.2s" begin="0.4s" repeatCount="indefinite" path={NAT_PATH} /></circle>
              <circle r="4" fill="#ffb547"><animateMotion dur="2.4s" begin="1.6s" repeatCount="indefinite" path={OUT_PATH} /></circle>
            </>
          )}
          <circle cx="420" cy="150" r="14" fill="#06070a" stroke="#ffb547" strokeWidth="2.5" />
          <circle cx="420" cy="150" r="5" fill="#ffb547" />
          <text x="14" y="52" className="fill-evm font-mono max-sm:hidden" fontSize="15">EVM · eth_estimateGas × gasPrice</text>
          <text x="14" y="262" className="fill-native font-mono max-sm:hidden" fontSize="15">Native · partialFee + storage deposit</text>
          <text x="790" y="126" textAnchor="end" className="fill-ink-100 font-display max-sm:hidden" fontSize="24" fontWeight="600">{a.top}</text>
          <text x="790" y="182" textAnchor="end" className="fill-ink-300 font-mono max-sm:hidden" fontSize="14">{a.bottom}</text>
        </svg>
        <div className="grid grid-cols-2 gap-2 px-4 font-mono text-[11px] sm:hidden">
          <span className="text-evm">● EVM gas × price</span>
          <span className="text-right text-native">Native fee + deposit ●</span>
          <div className="col-span-2 rounded-xl border border-ink-800 bg-ink-900/80 px-3 py-2 text-center">
            <div className="font-display text-base text-ink-100">{a.top}</div>
            <div className="text-ink-300">{a.bottom}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
