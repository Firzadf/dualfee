import { Link, NavLink } from 'react-router-dom';
import AnimatedOutlet from '../components/AnimatedOutlet';
import Wordmark from '../components/ui/Wordmark';
import Icon from '../components/ui/Icon';
import Backdrop from './Backdrop';
import { APP_NAV } from './nav';
import { useNet } from '../lib/network';

function SurfaceRow({ label, st, color, block, ms }: { label: string; st: { ok: boolean } | null; color: string; block?: number; ms?: number }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st === null ? 'animate-pulse bg-ink-500' : st.ok ? color : 'bg-red-400'}`} />
      <span className="text-ink-300">{label}</span>
      <span className="ml-auto tabular-nums text-ink-500">{st === null ? 'connecting' : st.ok ? `#${block?.toLocaleString('en-US')} · ${ms}ms` : 'down'}</span>
    </div>
  );
}

function Status() {
  const n = useNet();
  return (
    <div className="grid gap-1.5 rounded-xl border border-ink-800 bg-ink-925 p-3">
      <SurfaceRow label="EVM" st={n.evm} color="bg-evm" block={n.evm?.ok ? n.evm.block : undefined} ms={n.evm?.ok ? n.evm.latencyMs : undefined} />
      <SurfaceRow label="Native" st={n.native} color="bg-native" block={n.native?.ok ? n.native.block : undefined} ms={n.native?.ok ? n.native.latencyMs : undefined} />
      {n.evm && n.native && (!n.evm.ok || !n.native.ok) && <button className="mt-1 text-left font-mono text-[11px] text-ink-300 underline" onClick={n.retry}>retry connection</button>}
    </div>
  );
}

/** /app shell: fixed sidebar on desktop, top bar + bottom tab bar on mobile. */
export default function AppShell() {
  const n = useNet();
  return (
    <div className="relative min-h-screen md:pl-60">
      <Backdrop />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink-800 bg-ink-950/90 p-4 backdrop-blur md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <Wordmark className="text-lg" />
        </Link>
        <span className="kicker mb-2 px-2">Workspace</span>
        <nav className="grid gap-0.5">
          {APP_NAV.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${isActive ? 'bg-ink-800 text-white shadow-[inset_2px_0_0_#8b7bff]' : 'text-ink-300 hover:bg-ink-900 hover:text-white'}`}>
              <Icon name={l.icon} />{l.label}
            </NavLink>
          ))}
        </nav>
        <span className="kicker mb-2 mt-6 px-2">Reference</span>
        <nav className="grid gap-0.5">
          <NavLink to="/docs" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-300 hover:bg-ink-900 hover:text-white"><Icon name="docs" />Docs</NavLink>
          <NavLink to="/judges" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-300 hover:bg-ink-900 hover:text-white"><Icon name="verify" />Judges</NavLink>
          <NavLink to="/" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-300 hover:bg-ink-900 hover:text-white"><Icon name="home" />Home</NavLink>
        </nav>
        <div className="mt-auto"><Status /></div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-800 bg-ink-950/85 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2"><img src="/favicon.svg" alt="" className="h-6 w-6" /><Wordmark /></Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-500" aria-label="connection status">
            <span className={`h-1.5 w-1.5 rounded-full ${n.evm === null ? 'animate-pulse bg-ink-500' : n.evm.ok ? 'bg-evm' : 'bg-red-400'}`} />EVM
            <span className={`ml-1 h-1.5 w-1.5 rounded-full ${n.native === null ? 'animate-pulse bg-ink-500' : n.native.ok ? 'bg-native' : 'bg-red-400'}`} />NAT
          </span>
          <Link to="/docs" className="font-mono text-[11px] text-ink-300 underline">docs</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pt-8 md:pb-12">
        <AnimatedOutlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-800 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="App sections">
        <div className="flex overflow-x-auto [scrollbar-width:none]">
          {APP_NAV.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `flex min-w-[64px] flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] font-medium transition ${isActive ? 'text-white' : 'text-ink-500'}`}>
              {({ isActive }) => (<><Icon name={l.icon} className={`h-5 w-5 ${isActive ? 'text-evm' : ''}`} />{l.short}</>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
