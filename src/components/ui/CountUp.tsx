import { animate, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** Counts up to a live value once it is on screen. The final text is always exactly format(value). */
export default function CountUp({ value, format, className, duration = 0.9 }: { value: number; format: (n: number) => string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState<number | null>(reduce ? value : null);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    if (!inView) return;
    const c = animate(0, value, { duration, ease: [0.25, 0.1, 0.25, 1], onUpdate: setShown, onComplete: () => setShown(value) });
    return () => c.stop();
  }, [value, inView, reduce, duration]);
  // Before it is on screen the final value is laid out but invisible, so nothing ever reads 0.
  return <span ref={ref} className={className} style={shown === null ? { opacity: 0 } : undefined}>{format(shown ?? value)}</span>;
}
