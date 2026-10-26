import { Link } from 'react-router-dom';

const steps: { t: string; d: string; to?: string; href?: string; cta?: string }[] = [
  { t: '0–10s · Both surfaces are live', d: 'The network strip on any page shows the EVM chain id (420420777), block and gas price, and the Substrate chain, spec and token decimals (14 native vs 18 EVM) read from the runtime.', to: '/', cta: 'Home' },
  { t: '10–25s · Re-measure the ~800× claim', d: 'The home page measures the sample deploy as soon as both surfaces answer: the EVM figure, the native fee alone, and fee + storage deposit as one stacked bar.', to: '/', cta: 'Measure' },
  { t: '25–40s · Try any op', d: 'Fee Lab: switch between native transfer, ERC-20 transfer, deploy, or pasted calldata. Change the recipient to 0x2222…2222 to watch a storage deposit appear.', to: '/app/lab', cta: 'Fee Lab' },
  { t: '40–50s · Leaderboard', d: 'Six common ops measured in your browser, cached in localStorage with a timestamp. “Re-measure live” refreshes them.', to: '/app/leaderboard', cta: 'Leaderboard' },
  { t: '50–55s · History, calculator, share', d: 'History charts every measurement (ratio and gas price over time). The calculator turns ops/month into monthly cost on each surface. Any Lab result has a share link (/app/lab?op=deploy&code=sample&run=1) and an “Export report” JSON with a SHA-256 stamp you can check in /app/verify.', to: '/app/history', cta: 'History' },
  { t: '55–60s · Code and contract', d: 'packages/sdk exposes estimateBoth / pickCheapest and account mapping; FeeRegistry.sol records comparisons on-chain via MetaMask on /app/deploy. The method is in /docs. Unit tests cover fee math and decimals.', href: 'https://github.com/Firzadf/dualfee', cta: 'GitHub' },
];

export default function Judges() {
  return (
    <div className="grid gap-6">
      <div>
        <span className="kicker">Judges</span>
        <h1 className="h1">The 60-second path</h1>
        <p className="mt-1 text-sm text-ink-300">Everything is client-side and read-only. No wallet is needed except for the optional /app/deploy step.</p>
      </div>
      <ol className="grid gap-3">
        {steps.map((s) => (
          <li key={s.t} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-semibold">{s.t}</div>
              <p className="text-sm text-ink-300">{s.d}</p>
            </div>
            {s.to ? <Link to={s.to} className="btn-ghost shrink-0">{s.cta}</Link> : <a href={s.href} target="_blank" rel="noreferrer" className="btn-ghost shrink-0">{s.cta}</a>}
          </li>
        ))}
      </ol>
      <div className="card text-sm text-ink-300">
        <div className="mb-1 font-semibold text-ink-100">Honest limits</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Estimates, not receipts: both legs are dry-runs against current state; real fees can move with gas price, weight fee multiplier and state.</li>
          <li>Sample inputs use public testnet accounts and a token deployed by another builder; dry-runs need an origin that can afford the op.</li>
          <li>pallet-assets transfers have no verified EVM precompile address here, so that EVM leg is shown as unavailable.</li>
          <li>No EVM block explorer link is shown: Portaldot's official explorers are Substrate-side.</li>
        </ul>
      </div>
    </div>
  );
}
