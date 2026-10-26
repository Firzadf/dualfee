import { useMemo, useState } from 'react';
import { SAMPLE, SampleTokenBytecode, estimateBoth, isH160, parseUnits, type Comparison, type DualTx } from '@dualfee/sdk';
import ComparisonView from '../components/ComparisonView';
import NetworkStrip from '../components/NetworkStrip';
import MeasureButton from '../components/MeasureButton';
import { networkFrom, useNetworkStatus } from '../lib/network';

type Op = 'nativeTransfer' | 'erc20Transfer' | 'contractDeploy' | 'calldata';

const OPS: { id: Op; label: string }[] = [
  { id: 'nativeTransfer', label: 'Native transfer' },
  { id: 'erc20Transfer', label: 'ERC-20 transfer' },
  { id: 'contractDeploy', label: 'Contract deploy' },
  { id: 'calldata', label: 'Paste calldata' },
];

export default function FeeLab() {
  const status = useNetworkStatus();
  const net = networkFrom(status);
  const [op, setOp] = useState<Op>('contractDeploy');
  const [from, setFrom] = useState<string>(SAMPLE.holder);
  const [to, setTo] = useState<string>(SAMPLE.existingEoa);
  const [amount, setAmount] = useState('1');
  const [token, setToken] = useState<string>(SAMPLE.erc20Token);
  const [tokenTo, setTokenTo] = useState<string>(SAMPLE.existingRecipient);
  const [tokenAmount, setTokenAmount] = useState('1');
  const [bytecode, setBytecode] = useState<string>(SampleTokenBytecode);
  const [callTo, setCallTo] = useState<string>(SAMPLE.erc20Token);
  const [callData, setCallData] = useState<string>('0x18160ddd');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Comparison | null>(null);

  const tx = useMemo((): DualTx | string => {
    try {
      if (!isH160(from)) return 'From must be a 0x… EVM address (used only as the dry-run origin; nothing is signed).';
      switch (op) {
        case 'nativeTransfer':
          return { kind: 'nativeTransfer', from, to, amountPlanck: parseUnits(amount, net.nativeDecimals) };
        case 'erc20Transfer':
          return { kind: 'erc20Transfer', from, token, to: tokenTo, amount: parseUnits(tokenAmount, SAMPLE.erc20Decimals) };
        case 'contractDeploy':
          return { kind: 'contractDeploy', from, bytecode: bytecode.trim() };
        case 'calldata':
          return { kind: 'calldata', from, to: callTo.trim() || undefined, data: callData.trim() };
      }
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [op, from, to, amount, token, tokenTo, tokenAmount, bytecode, callTo, callData, net.nativeDecimals]);

  async function run() {
    if (typeof tx === 'string') return setError(tx);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await estimateBoth(tx, { network: net, api: status.api ?? undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fee Lab</h1>
        <p className="mt-1 text-sm text-ink-300">Pick an operation. DualFee asks both surfaces for a live estimate of the same thing, in parallel, from your browser.</p>
      </div>
      <NetworkStrip s={status} />
      <div className="card grid gap-4">
        <div className="flex flex-wrap gap-2" role="tablist">
          {OPS.map((o) => (
            <button key={o.id} role="tab" aria-selected={op === o.id} onClick={() => { setOp(o.id); setResult(null); }} className={`rounded-xl px-3 py-2 text-sm ${op === o.id ? 'bg-ink-100 font-semibold text-ink-950' : 'border border-ink-700 text-ink-300'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <Field label="From (dry-run origin, never signs)" value={from} onChange={setFrom} />
        {op === 'nativeTransfer' && (
          <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
            <Field label="To" value={to} onChange={setTo} />
            <Field label="Amount (tPOT)" value={amount} onChange={setAmount} />
          </div>
        )}
        {op === 'erc20Transfer' && (
          <>
            <Field label={`Token (default: ${SAMPLE.erc20Symbol}, ${SAMPLE.erc20Decimals} dp)`} value={token} onChange={setToken} />
            <div className="grid gap-4 sm:grid-cols-[1fr,10rem]">
              <Field label="Recipient" value={tokenTo} onChange={setTokenTo} />
              <Field label="Amount (tokens)" value={tokenAmount} onChange={setTokenAmount} />
            </div>
            <p className="text-xs text-ink-500">Tip: a recipient that never held the token (e.g. 0x2222…2222) creates a new storage slot, so a storage deposit appears on both sides.</p>
          </>
        )}
        {op === 'contractDeploy' && (
          <div>
            <label className="label">Creation bytecode (default: SampleToken.sol, {(SampleTokenBytecode.length - 2) / 2} bytes)</label>
            <textarea className="input h-28 resize-y" value={bytecode} onChange={(e) => setBytecode(e.target.value)} spellCheck={false} />
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
      {result && <ComparisonView c={result} net={net} />}
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
