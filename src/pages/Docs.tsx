import { Link } from 'react-router-dom';
import { PORTALDOT_V3, TIE_BAND, DRY_RUN_DEPOSIT_LIMIT } from '@dualfee/sdk';
import { useNet } from '../lib/network';
import { tpot } from '../lib/format';
import Reveal from '../components/ui/Reveal';

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-950 p-3 font-mono text-[12px] leading-relaxed text-ink-100">{children}</pre>;
}

type Sec = { id: string; title: string; body: React.ReactNode };

export default function Docs() {
  const n = useNet();
  const nat = n.native && n.native.ok ? n.native : null;
  const sections: Sec[] = [
    {
      id: 'methodology',
      title: 'Methodology',
      body: (
        <>
          <p>Every comparison starts from one <span className="mono">DualTx</span> (native transfer, ERC-20 transfer, contract deploy, raw calldata, or a native-only pallet-assets transfer). The SDK prices it on both surfaces <b>in parallel</b>, from your browser, against current chain state. Nothing is signed or sent; the <span className="mono">from</span> address is only the dry-run origin.</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li><b className="text-evm">EVM leg</b>: <span className="mono">eth_estimateGas</span>, <span className="mono">eth_gasPrice</span> and <span className="mono">eth_blockNumber</span> on the pallet-revive Ethereum RPC.</li>
            <li><b className="text-native">Native leg</b>: a <span className="mono">ReviveApi.call</span> / <span className="mono">ReviveApi.instantiate</span> dry-run with a storage-deposit limit of <span className="mono">{DRY_RUN_DEPOSIT_LIMIT.toString()}</span> planck (a zero/None limit makes revive dry-runs fail) returns <span className="mono">weightRequired</span> and the storage deposit; the real extrinsic is then weighed with <span className="mono">TransactionPaymentApi.query_info</span> for <span className="mono">partialFee</span>. Plain transfers go straight to <span className="mono">query_info</span> on <span className="mono">balances.transferKeepAlive</span>.</li>
            <li><b>Compare all-in</b>: both sides in planck, fee + deposit, with the fee-only ratio shown next to it so headline multiples can be checked.</li>
          </ol>
        </>
      ),
    },
    {
      id: 'formulas',
      title: 'Formulas',
      body: (
        <>
          <Code>{`evm_fee_wei      = eth_estimateGas(tx) × eth_gasPrice
evm_total_planck = floor(evm_fee_wei / 10^(evmDecimals − nativeDecimals))   // = ÷ nativeToEthRatio

native_total     = partialFee + storageDeposit                               // planck
ratio_all_in     = evm_total_planck / native_total
ratio_fee_only   = evm_total_planck / partialFee                             // how "~800×" is produced

recommended      = "either" if |evm − native| / max(evm, native) ≤ ${(TIE_BAND * 100).toFixed(0)}%
                   else the cheaper surface`}</Code>
          <p>Division truncates toward zero, the same way pallet-revive drops sub-planck "dust" when converting wei → planck. Ratios are computed in bigint with a 10⁶ scale before becoming floats, so large values never lose precision mid-calculation.</p>
        </>
      ),
    },
    {
      id: 'units',
      title: 'Units',
      body: (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="font-mono text-[11px] uppercase tracking-wider text-ink-500"><tr><th className="py-2 pr-4">Unit</th><th className="py-2 pr-4">Decimals</th><th className="py-2">Where it comes from</th></tr></thead>
              <tbody className="divide-y divide-ink-800">
                <tr><td className="py-2 pr-4 mono">tPOT</td><td className="py-2 pr-4 num">—</td><td className="py-2">Testnet token symbol (<span className="mono">system_properties.tokenSymbol</span>){nat ? `; live: ${nat.symbol}` : ''}</td></tr>
                <tr><td className="py-2 pr-4 mono">planck</td><td className="py-2 pr-4 num">{nat ? nat.decimals : PORTALDOT_V3.nativeDecimals}</td><td className="py-2">Native balances (<span className="mono">tokenDecimals</span>, read live)</td></tr>
                <tr><td className="py-2 pr-4 mono">wei</td><td className="py-2 pr-4 num">{nat && nat.evmDecimals !== null ? nat.evmDecimals : PORTALDOT_V3.evmDecimals}</td><td className="py-2">EVM RPC values; nativeDecimals + log₁₀(<span className="mono">revive.nativeToEthRatio</span>{nat && nat.ratio !== null ? ` = ${nat.ratio}` : ' = 10000'})</td></tr>
                <tr><td className="py-2 pr-4 mono">deposit / byte</td><td className="py-2 pr-4 num">—</td><td className="py-2"><span className="mono">revive.depositPerByte</span>{nat && nat.depositPerByte !== null ? ` = ${tpot(nat.depositPerByte, nat.decimals, 4)} tPOT (live)` : ''}</td></tr>
                <tr><td className="py-2 pr-4 mono">deposit / item</td><td className="py-2 pr-4 num">—</td><td className="py-2"><span className="mono">revive.depositPerItem</span>{nat && nat.depositPerItem !== null ? ` = ${tpot(nat.depositPerItem, nat.decimals, 4)} tPOT (live)` : ''}</td></tr>
              </tbody>
            </table>
          </div>
          <p>Chain id <span className="mono">{PORTALDOT_V3.chainId}</span> (<span className="mono">{PORTALDOT_V3.chainIdHex}</span>), SS58 prefix <span className="mono">{PORTALDOT_V3.ss58Format}</span>. Verified constants are only a fallback when the runtime can't be read.</p>
        </>
      ),
    },
    {
      id: 'deposit',
      title: 'Why the storage deposit dominates',
      body: (
        <p>pallet-revive makes every call pay a <b className="text-deposit">deposit</b> for the bytes and items it leaves in state. It is a <i>hold</i>, not a burn: it's returned when the storage is freed. A deploy stores the whole contract code, so its deposit is hundreds of times the weight fee, while a transfer to an existing holder stores nothing new and pays no deposit. On the EVM surface, <span className="mono">eth_estimateGas</span> folds that deposit into the gas figure; on the native surface it is reported separately. Comparing EVM gas against <span className="mono">partialFee</span> alone is therefore apples to oranges. (That the EVM figure folds the deposit in is our inference from the numbers — EVM total ≈ native fee + deposit to within ~2% — not something we read in docs.)</p>
      ),
    },
    {
      id: 'calculator',
      title: 'Cost calculator',
      body: (
        <>
          <Code>{`monthly_evm        = evm_total_planck × n
monthly_native     = (partialFee + storageDeposit) × n
of which held      = storageDeposit × n            // refundable hold, not burned
difference         = |monthly_evm − monthly_native|
cheaper            = "either" within ${(TIE_BAND * 100).toFixed(0)}%, else the smaller one`}</Code>
          <p>All in bigint planck. It is a linear projection of one live measurement: it assumes today's gas price, fee multiplier and storage pattern for every op.</p>
        </>
      ),
    },
    {
      id: 'reports',
      title: 'Share links, reports & verification',
      body: (
        <>
          <p>Fee Lab state is encoded in the URL (<span className="mono">/app/lab?op=deploy&amp;code=sample&amp;run=1</span>; keys <span className="mono">op, from, to, amount, token, rcpt, tamt, code, callTo, data, run</span>). Every value is validated on load; invalid ones are dropped and listed. Custom hex longer than 12,000 chars is left out of the URL.</p>
          <Code>{`report = { schema: "dualfee.report/v1", generatedAt, app, op, network, comparison }
stamp  = SHA-256( canonical_json(report) )      // keys sorted, bigints as strings, no whitespace
verify : recompute over the file minus "stamp" and compare`}</Code>
          <p>The stamp proves integrity (the numbers weren't edited after export), not origin: it's a hash, not a signature. For an on-chain record, use <Link className="underline" to="/app/deploy">Deploy / Record</Link>, which writes a keccak256 of the comparison to FeeRegistry.sol.</p>
        </>
      ),
    },
    {
      id: 'limits',
      title: 'Limits',
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Estimates, not receipts.</b> Real fees move with gas price, the fee multiplier and state (a fresh recipient adds a storage slot).</li>
          <li><b>Sample inputs are public testnet data.</b> A dry-run needs an origin that can afford the op, so a custom <span className="mono">from</span> with no balance can come back as unavailable.</li>
          <li><b>pallet-assets</b> has no verified ERC-20 precompile address here, so that EVM leg is shown as unavailable; we don't guess one.</li>
          <li><b>No EVM explorer links.</b> Portaldot's official explorers are Substrate-side.</li>
          <li><b>Local only.</b> History and caches live in your browser's localStorage (newest 500 measurements); nothing is uploaded.</li>
          <li><b>Calculator is linear.</b> It does not model gas-price or fee-multiplier drift over a month.</li>
        </ul>
      ),
    },
    {
      id: 'sources',
      title: 'Sources',
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li>EVM RPC: <span className="mono">{PORTALDOT_V3.evmRpc}</span> · Substrate WSS: <span className="mono">{PORTALDOT_V3.substrateWss}</span> (every live number on this site).</li>
          <li>Polkadot SDK <span className="mono">pallet-revive</span>: <a className="underline" href="https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive" target="_blank" rel="noreferrer">github.com/paritytech/polkadot-sdk/…/frame/revive</a> (account mapping, <span className="mono">nativeToEthRatio</span>, <span className="mono">ReviveApi</span>).</li>
          <li>Ethereum JSON-RPC: <a className="underline" href="https://ethereum.org/en/developers/docs/apis/json-rpc/" target="_blank" rel="noreferrer">ethereum.org/en/developers/docs/apis/json-rpc</a>.</li>
          <li>The ~289 vs 0.36 tPOT (~800×) deploy figure was reported by another Portaldot Hacker House builder; DualFee credits it and re-measures it live.</li>
          <li>Design references: <a className="underline" href="https://github.com/Firzadf/dualfee/blob/main/docs/design-references.md" target="_blank" rel="noreferrer">docs/design-references.md</a>.</li>
        </ul>
      ),
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[12rem,1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 grid gap-1 text-sm">
          <span className="kicker mb-2">On this page</span>
          {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="text-ink-300 hover:text-white">{s.title}</a>)}
        </nav>
      </aside>
      <div className="grid min-w-0 gap-10">
        <div className="grid gap-2">
          <span className="kicker">Docs</span>
          <h1 className="h1">How DualFee measures</h1>
          <p className="max-w-2xl text-ink-300">Everything a reviewer needs to check a number on this site: what is called, how units are reconciled, and what we can't know.</p>
        </div>
        {sections.map((s, i) => (
          <Reveal key={s.id}>
            <section id={s.id} className="grid scroll-mt-24 gap-3 text-sm leading-relaxed text-ink-300">
              <span className="kicker">§ {String(i + 1).padStart(2, '0')}</span>
              <h2 className="font-display text-xl font-semibold text-ink-100 sm:text-2xl">{s.title}</h2>
              {s.body}
            </section>
          </Reveal>
        ))}
        <div className="flex flex-wrap gap-3">
          <Link to="/app/lab" className="btn-primary">Open the Fee Lab</Link>
          <Link to="/judges" className="btn-ghost">60-second path</Link>
        </div>
      </div>
    </div>
  );
}
