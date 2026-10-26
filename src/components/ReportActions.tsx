import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PORTALDOT_V3, type Comparison } from '@dualfee/sdk';
import { buildReport } from '../lib/report';
import { useNet } from '../lib/network';
import CopyButton from './ui/CopyButton';

/** Share link + "Export report" (JSON with a SHA-256 stamp) for one comparison. */
export default function ReportActions({ c, opId, label, share }: { c: Comparison; opId: string; label: string; share?: { url: string; omitted: string[] } }) {
  const net = useNet();
  const [hash, setHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function exportReport() {
    setErr(null);
    try {
      const r = await buildReport(c, {
        opId, label, shareUrl: share?.url,
        network: { evmRpc: PORTALDOT_V3.evmRpc, substrateWss: PORTALDOT_V3.substrateWss, chainId: net.evm && net.evm.ok ? net.evm.chainId : PORTALDOT_V3.chainId, nativeDecimals: net.config.nativeDecimals, evmDecimals: net.config.evmDecimals },
      });
      const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `dualfee-${opId}-${r.generatedAt.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setHash(r.stamp.hash);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="panel grid gap-3">
      <div className="label">Share & export</div>
      {share && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="mono min-w-0 flex-1 rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-[11px] text-ink-300">{share.url}</code>
          <CopyButton text={share.url} label="Copy link" />
        </div>
      )}
      {share && share.omitted.length > 0 && <p className="text-[11px] text-ink-500">Custom {share.omitted.join(', ')} is too long for a URL; the link opens the same op with default {share.omitted.join(', ')}.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-ghost" onClick={exportReport}>Export report (.json)</button>
        <Link to="/app/verify" className="text-xs text-ink-300 underline">verify a report →</Link>
      </div>
      {hash && <p className="font-mono text-[11px] text-ink-300">SHA-256 stamp <span className="mono text-ink-100">{hash}</span></p>}
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}
