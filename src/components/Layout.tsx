import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

const links = [
  { to: '/lab', label: 'Fee Lab' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/deploy', label: 'Deploy' },
  { to: '/judges', label: 'Judges' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight" onClick={() => setOpen(false)}>
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span>DualFee</span>
            <span className="hidden rounded-md border border-ink-700 px-1.5 py-0.5 text-[10px] uppercase text-ink-300 sm:inline">Portaldot V3 testnet</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button className="rounded-lg border border-ink-700 px-3 py-1.5 text-sm sm:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-ink-800 px-4 py-2 sm:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-ink-800 text-white' : 'text-ink-300'}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-ink-500 sm:flex-row sm:justify-between">
          <span>
            Independent solo build by Firza Duta Fauzan (<a className="underline" href="https://x.com/dutzozan" target="_blank" rel="noreferrer">@dutzozan</a>). MIT. Read-only, no keys, no backend.
          </span>
          <span>
            Sibling project: <a className="underline" href="https://nodescope.vercel.app" target="_blank" rel="noreferrer">NodeScope</a> ·{' '}
            <a className="underline" href="https://github.com/Firzadf/dualfee" target="_blank" rel="noreferrer">Source</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
