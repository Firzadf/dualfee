import type { Transition, Variants } from 'framer-motion';

/** One easing curve for the whole app (MotionSites convention). */
export const EASE = [0.25, 0.1, 0.25, 1] as const;
export const T: Transition = { duration: 0.45, ease: EASE };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: T },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
