import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AnimatedOutlet from '../components/AnimatedOutlet';
import Wordmark from '../components/ui/Wordmark';
import Backdrop from './Backdrop';
import { useNet } from '../lib/network';

const links = [
  { to: '/app/lab', label: 'App' },
  { to: '/docs', label: 'Docs' },
  { to: '/judges', label: 'Judges' },
];

function StatusPill() {
  const n = useNet();
  const dot = (st: { ok: boolean } | null, c: string) => <span className={`h-1.5 w-1.5 rounded-full ${st === null ? 'animate-pulse bg-ink-500' : st.ok ? c : 'bg-red-400'}`} />;
  return (
    <span className="chip hidden md:inline-flex" title="EVM / Native connection">
      {dot(n.evm, 'bg-evm')}{dot(n.native, 'bg-native')}
      <span>{n.ready ? 'both surfaces live' : 'connecting…'}</span>
    </span>
  );
}

export default function SiteLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <header className="sticky top-0 z-30 border-b border-ink-800/80 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <Wordmark className="text-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <StatusPill />
            <nav className="hidden gap-1 sm:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm transition ${isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'}`}>{l.label}</NavLink>
              ))}
            </nav>
            <Link to="/app/lab" className="btn-primary hidden !py-1.5 sm:inline-flex">Launch app</Link>
            <button className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm sm:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : 'Menu'}</button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid gap-1 overflow-hidden border-t border-ink-800 px-4 sm:hidden">
              <div className="py-2">
                {links.map((l) => (
                  <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-ink-800 text-white' : 'text-ink-300'}`}>{l.label}</NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-ink-800">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-ink-300 sm:grid-cols-[1.5fr,1fr,1fr]">
        <div className="grid gap-2">
          <Wordmark className="text-xl" />
          <p className="max-w-sm text-xs text-ink-500">Live EVM vs native fee comparison for Portaldot V3. Client-side, read-only, no keys, no backend. MIT.</p>
          <p className="text-xs text-ink-500">Independent solo build by Firza Duta Fauzan (<a className="underline hover:text-ink-100" href="https://x.com/dutzozan" target="_blank" rel="noreferrer">@dutzozan</a>).</p>
        </div>
        <div className="grid content-start gap-1.5">
          <span className="kicker mb-1">Product</span>
          <Link to="/app/lab" className="hover:text-white">Fee Lab</Link>
          <Link to="/app/leaderboard" className="hover:text-white">Leaderboard</Link>
          <Link to="/docs" className="hover:text-white">Methodology</Link>
          <Link to="/judges" className="hover:text-white">60-second path</Link>
        </div>
        <div className="grid content-start gap-1.5">
          <span className="kicker mb-1">Elsewhere</span>
          <a href="https://github.com/Firzadf/dualfee" target="_blank" rel="noreferrer" className="hover:text-white">Source on GitHub</a>
          <a href="https://nodescope.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white">NodeScope (sibling)</a>
          <a href="https://node-console.portaldot.dev/" target="_blank" rel="noreferrer" className="hover:text-white">Portaldot node console</a>
        </div>
      </div>
    </footer>
  );
}
