import { useState } from 'react';
import { verifyReport, type VerifyResult } from '../lib/report';

export default function Verify() {
  const [text, setText] = useState('');
  const [res, setRes] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(t = text) {
    setBusy(true);
    try { setRes(await verifyReport(t)); } finally { setBusy(false); }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    const t = await f.text();
    setText(t);
    await check(t);
  }

  const r = res && res.ok ? res.report : null;
  const cmp = r ? (r.comparison as { ratioAllIn?: number | null; ratioVsNativeFeeOnly?: number | null; recommended?: string | null; measuredAt?: string }) : null;

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="kicker">App / Verify</span>
        <h1 className="h1">Verify a report</h1>
        <p className="text-sm text-ink-300">Paste or upload a report exported from the Fee Lab. DualFee recomputes SHA-256 over the canonical JSON (keys sorted, without <span className="mono">stamp</span>) and compares it with the stamp. This proves the file wasn't edited after export; it is not a signature, so it can't prove who exported it.</p>
      </div>
      <div className="card grid gap-3">
        <label className="label" htmlFor="rep">Report JSON</label>
        <textarea id="rep" className="input h-48 resize-y" value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} placeholder='{"schema":"dualfee.report/v1", …}' spellCheck={false} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" disabled={busy || !text.trim()} onClick={() => check()}>Verify stamp</button>
          <label className="btn-ghost cursor-pointer">Upload .json<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
        </div>
      </div>
      {res && (res.ok ? (
        <div className="rounded-2xl border border-native/40 bg-native-soft p-4 text-sm">
          <div className="font-semibold text-native">✓ Stamp matches</div>
          <p className="mono mt-1 text-[11px] text-ink-300">SHA-256 {res.hash}</p>
          {r && cmp && (
            <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-xs text-ink-300">
              <dt>operation</dt><dd className="text-ink-100">{r.op.label} <span className="mono text-ink-500">({r.op.id})</span></dd>
              <dt>measured</dt><dd className="mono text-ink-100">{cmp.measuredAt ? new Date(cmp.measuredAt).toLocaleString() : '—'}</dd>
              <dt>all-in ratio</dt><dd className="mono text-ink-100">{cmp.ratioAllIn ?? '—'}</dd>
              <dt>fee-only ratio</dt><dd className="mono text-ink-100">{cmp.ratioVsNativeFeeOnly ?? '—'}</dd>
              <dt>recommended</dt><dd className="mono text-ink-100">{cmp.recommended ?? '—'}</dd>
              <dt>network</dt><dd className="mono text-ink-100">chain {r.network.chainId} · {r.network.nativeDecimals}/{r.network.evmDecimals} dp</dd>
              {r.op.shareUrl && <><dt>reproduce</dt><dd><a className="mono break-all text-ink-100 underline" href={r.op.shareUrl}>{r.op.shareUrl}</a></dd></>}
            </dl>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <div className="font-semibold text-red-300">✗ {res.reason}</div>
          {res.expected && <p className="mono mt-1 text-[11px] text-ink-300">stamp&nbsp;&nbsp;{res.expected}<br />actual {res.actual}</p>}
        </div>
      ))}
    </div>
  );
}
