import { useState } from 'react';

export async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

export default function CopyButton({ text, label = 'Copy', className = 'btn-ghost !px-3 !py-1.5 text-xs' }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  return (
    <button
      type="button"
      className={className}
      onClick={async () => { setState((await copyText(text)) ? 'ok' : 'fail'); setTimeout(() => setState('idle'), 1500); }}
      aria-live="polite"
    >
      {state === 'ok' ? 'Copied ✓' : state === 'fail' ? 'Copy failed' : label}
    </button>
  );
}
