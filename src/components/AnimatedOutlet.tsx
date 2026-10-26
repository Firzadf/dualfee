import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { EASE } from '../lib/motion';
import Spinner from './ui/Spinner';

export function PageFallback() {
  return (
    <div className="flex items-center gap-2 py-10 font-mono text-xs text-ink-500"><Spinner /> loading…</div>
  );
}

/** Cross-fades between child routes; resets scroll on navigation. */
export default function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -6, transition: { duration: 0.15, ease: EASE } }}
      >
        <Suspense fallback={<PageFallback />}>{outlet}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
