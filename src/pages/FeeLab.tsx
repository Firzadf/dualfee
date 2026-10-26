import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeeRegistryBytecode, SAMPLE, SampleTokenBytecode, estimateBoth, isH160, parseUnits, type Comparison, type DualTx } from '@dualfee/sdk';
import ComparisonView from '../components/ComparisonView';
import NetworkStrip from '../components/NetworkStrip';
import MeasureButton from '../components/MeasureButton';
import FeeBreakdown from '../components/FeeBreakdown';
import ReportActions from '../components/ReportActions';
import { motion } from 'framer-motion';
import { EASE } from '../lib/motion';
import { useNet } from '../lib/network';
import { decodeLabParams, shareUrl, type LabOp, type LabParams } from '../lib/share';
import { recordComparison } from '../lib/history';

const OPS: { id: LabOp; label: string }[] = [
  { id: 'transfer', label: 'Native transfer' },
  { id: 'erc20', label: 'ERC-20 transfer' },
  { id: 'deploy', label: 'Contract deploy' },
  { id: 'calldata', label: 'Paste calldata' },
];

type CodeChoice = 'sample' | 'registry' | 'custom';
const codeOf = (c: CodeChoice, custom: string) => (c === 'sample' ? SampleTokenBytecode : c === 'registry' ? FeeRegistryBytecode : custom.trim());

export default function FeeLab() {
  const net = useNet();
  const [sp, setSp] = useSearchParams();
  const initial = useMemo(() => decodeLabParams(sp.toString()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const p = initial.params;
  const [op, setOp] = useState<LabOp>(p.op ?? 'deploy');
  const [from, setFrom] = useState<string>(p.from ?? SAMPLE.holder);
  const [to, setTo] = useState<string>(p.to ?? SAMPLE.existingEoa);
  const [amount, setAmount] = useState(p.amount ?? '1');
  const [token, setToken] = useState<string>(p.token ?? SAMPLE.erc20Token);
  const [tokenTo, setTokenTo] = useState<string>(p.recipient ?? SAMPLE.existingRecipient);
  const [tokenAmount, setTokenAmount] = useState(p.tokenAmount ?? '1');
  const [codeChoice, setCodeChoice] = useState<CodeChoice>(p.code === 'registry' ? 'registry' : p.code && p.code !== 'sample' ? 'custom' : 'sample');
  const [customCode, setCustomCode] = useState<string>(p.code && p.code.startsWith('0x') ? p.code : '');
  const [callTo, setCallTo] = useState<string>(p.callTo ?? SAMPLE.erc20Token);
  const [callData, setCallData] = useState<string>(p.data ?? '0x18160ddd');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ c: Comparison; params: LabParams } | null>(null);
  const autoRan = useRef(false);
  const d = net.config.nativeDecimals;

  const params: LabParams = useMemo(() => {
    const base: LabParams = { op, from: from === SAMPLE.holder ? undefined : from };
    if (op === 'transfer') Object.assign(base, { to: to === SAMPLE.existingEoa ? undefined : to, amount: amount === '1' ? undefined : amount });
    if (op === 'erc20') Object.assign(base, { token: token === SAMPLE.erc20Token ? undefined : token, recipient: tokenTo === SAMPLE.existingRecipient ? undefined : tokenTo, tokenAmount: tokenAmount === '1' ? undefined : tokenAmount });
    if (op === 'deploy') base.code = codeChoice === 'custom' ? customCode.trim() : codeChoice;
    if (op === 'calldata') Object.assign(base, { callTo: callTo.trim(), data: callData.trim() });
    return base;
  }, [op, from, to, amount, token, tokenTo, tokenAmount, codeChoice, customCode, callTo, callData]);

  const tx = useMemo((): DualTx | string => {
    try {
      if (!isH160(from)) return 'From must be a 0x… EVM address (used only as the dry-run origin; nothing is signed).';
      switch (op) {
        case 'transfer': return { kind: 'nativeTransfer', from, to, amountPlanck: parseUnits(amount, d) };
        case 'erc20': return { kind: 'erc20Transfer', from, token, to: tokenTo, amount: parseUnits(tokenAmount, SAMPLE.erc20Decimals) };
        case 'deploy': return { kind: 'contractDeploy', from, bytecode: codeOf(codeChoice, customCode) };
        case 'calldata': return { kind: 'calldata', from, to: callTo.trim() || undefined, data: callData.trim() };
      }
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [op, from, to, amount, token, tokenTo, tokenAmount, codeChoice, customCode, callTo, callData, d]);

  async function run() {
    if (typeof tx === 'string') return setError(tx);
    setBusy(true);
    setError(null);
    try {
      const c = await estimateBoth(tx, { network: net.config, api: net.api ?? undefined });
      setResult({ c, params });
      recordComparison(c, { opId: `lab-${op}${op === 'deploy' ? `-${codeChoice}` : ''}`, label: `Lab · ${OPS.find((o) => o.id === op)!.label}${op === 'deploy' ? ` (${codeChoice})` : ''}`, source: 'lab' });
      // Keep the address bar reproducible: the current URL now encodes exactly what was measured.
      const q = new URLSearchParams(shareUrl('', params).url.split('?')[1]);
      setSp(q, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (p.run && net.ready && !autoRan.current) { autoRan.current = true; void run(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net.ready]);

  const share = result ? shareUrl(window.location.origin, { ...result.params, run: true }) : null;

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="kicker">App / Fee Lab</span>
        <h1 className="h1">Fee Lab</h1>
        <p className="text-sm text-ink-300">Pick an operation. DualFee asks both surfaces for a live estimate of the same thing, in parallel, from your browser. Every measurement is saved to History and can be shared as a link.</p>
      </div>
      <NetworkStrip />
      {initial.errors.length > 0 && <p className="rounded-xl border border-deposit/40 bg-deposit-soft px-3 py-2 text-xs text-deposit">Ignored from the link: {initial.errors.join(', ')}.</p>}
      <div className="card grid gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {OPS.map((o) => (
            <button key={o.id} role="tab" aria-selected={op === o.id} onClick={() => { setOp(o.id); setResult(null); }} className={`rounded-xl px-3 py-2 text-sm transition ${op === o.id ? 'bg-ink-100 font-semibold text-ink-950' : 'border border-ink-700 text-ink-300 hover:text-white'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <Field label="From (dry-run origin, never signs)" value={from} onChange={setFrom} />
        {op === 'transfer' && (
          <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
            <Field label="To" value={to} onChange={setTo} />
            <Field label="Amount (tPOT)" value={amount} onChange={setAmount} />
          </div>
        )}
        {op === 'erc20' && (
          <>
            <Field label={`Token (default: ${SAMPLE.erc20Symbol}, ${SAMPLE.erc20Decimals} dp)`} value={token} onChange={setToken} />
            <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
              <Field label="Recipient" value={tokenTo} onChange={setTokenTo} />
              <Field label="Amount (tokens)" value={tokenAmount} onChange={setTokenAmount} />
            </div>
            <p className="text-xs text-ink-500">Tip: a recipient that never held the token (e.g. <button className="mono underline" onClick={() => setTokenTo('0x2222222222222222222222222222222222222222')}>0x2222…2222</button>) creates a new storage slot, so a storage deposit appears.</p>
          </>
        )}
        {op === 'deploy' && (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {(['sample', 'registry', 'custom'] as CodeChoice[]).map((c) => (
                <button key={c} onClick={() => { setCodeChoice(c); setResult(null); }} className={`chip ${codeChoice === c ? '!border-evm !text-ink-100' : ''}`}>
                  {c === 'sample' ? `SampleToken.sol · ${(SampleTokenBytecode.length - 2) / 2} B` : c === 'registry' ? `FeeRegistry.sol · ${(FeeRegistryBytecode.length - 2) / 2} B` : 'Custom bytecode'}
                </button>
              ))}
            </div>
            {codeChoice === 'custom' ? (
              <div>
                <label className="label">Creation bytecode (0x…)</label>
                <textarea className="input h-28 resize-y" value={customCode} onChange={(e) => setCustomCode(e.target.value)} spellCheck={false} placeholder="0x6080…" />
              </div>
            ) : (
              <pre className="mono max-h-24 overflow-hidden rounded-xl border border-ink-800 bg-ink-950 p-3 text-[11px] text-ink-500">{codeOf(codeChoice, '').slice(0, 400)}…</pre>
            )}
          </div>
        )}
        {op === 'calldata' && (
          <>
            <Field label="To (leave empty for a create)" value={callTo} onChange={setCallTo} />
            <div>
              <label className="label">Calldata</label>
              <textarea className="input h-24 resize-y" value={callData} onChange={(e) => setCallData(e.target.value)} spellCheck={false} />
            </div>
          </>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <MeasureButton busy={busy} onClick={run} idle="Estimate on both surfaces" />
          <span className="text-xs text-ink-500">EVM: eth_estimateGas × eth_gasPrice. Native: ReviveApi dry-run + TransactionPaymentApi.query_info.</span>
        </div>
        {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      </div>
      {result && (
        <motion.div className="grid gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <ComparisonView c={result.c} net={net.config} />
          <div className="panel grid gap-3">
            <div className="label">Fee breakdown</div>
            <FeeBreakdown c={result.c} decimals={d} />
          </div>
          <ReportActions c={result.c} opId={`lab-${result.params.op}`} label={OPS.find((o) => o.id === result.params.op)!.label} share={share ?? undefined} />
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0">
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} autoComplete="off" />
    </div>
  );
}
