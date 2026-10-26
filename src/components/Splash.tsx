import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { EASE, prefersReducedMotion } from '../lib/motion';

const KEY = 'dualfee.splash.seen';
/** Visible at least this long (lets the wordmark land), at most HARD_CAP regardless of network. */
const MIN_MS = 1200;
const SOFT_MAX_MS = 1600;
const EXIT_MS = 400;
const HARD_CAP_MS = 2500;

export function splashAlreadySeen(): boolean {
  try { return sessionStorage.getItem(KEY) === '1'; } catch { return true; }
}

/**
 * Branded intro, once per browser session. It is an overlay: the app mounts (and both RPC
 * handshakes start) underneath it, so it never delays real work. `ready` lets it leave early
 * once both surfaces have answered; it is gone by ~2s (hard cap 2.5s including the exit wipe).
 */
export default function Splash({ ready = false, status }: { ready?: boolean; status?: ReactNode }) {
  const [show, setShow] = useState(() => !splashAlreadySeen());
  const [t0] = useState(() => performance.now());
  const reduce = prefersReducedMotion();

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    const min = reduce ? 300 : MIN_MS;
    const elapsed = performance.now() - t0;
    const wait = ready ? Math.max(0, min - elapsed) : Math.max(0, (reduce ? 600 : SOFT_MAX_MS) - elapsed);
    const id = setTimeout(() => setShow(false), Math.min(wait, HARD_CAP_MS - EXIT_MS));
    const cap = setTimeout(() => setShow(false), Math.max(0, HARD_CAP_MS - EXIT_MS - elapsed));
    return () => { clearTimeout(id); clearTimeout(cap); };
  }, [show, ready, reduce, t0]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-950"
          initial={{ opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { clipPath: 'inset(0 0 100% 0)', transition: { duration: EXIT_MS / 1000, ease: EASE } }}
          role="status"
          aria-label="Loading DualFee"
          onClick={() => setShow(false)}
        >
          <div className="pointer-events-none absolute inset-0 bg-grid" />
          <div className="relative flex flex-col items-center gap-6 px-6">
            <div className="relative h-16 w-64 max-w-[80vw]">
              <motion.span
                className="absolute left-0 top-3 h-2 rounded-full bg-evm"
                initial={reduce ? false : { width: 0, x: -40, opacity: 0 }}
                animate={{ width: '50%', x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              />
              <motion.span
                className="absolute right-0 bottom-3 h-2 rounded-full bg-native"
                initial={reduce ? false : { width: 0, x: 40, opacity: 0 }}
                animate={{ width: '50%', x: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.08 }}
              />
              <motion.span
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-deposit shadow-[0_0_24px_#ffb547]"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 400, damping: 18 }}
              />
            </div>
            <motion.div
              className="font-display text-4xl font-semibold tracking-tight sm:text-5xl"
              initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
            >
              <span className="text-evm">Dual</span><span className="text-native">Fee</span>
            </motion.div>
            <motion.div
              className="min-h-[2.5rem] text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-500"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {status ?? 'Portaldot V3 · EVM ⇄ Native'}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
