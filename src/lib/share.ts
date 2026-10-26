import { isH160 } from '@dualfee/sdk';

/** Short, human-typable op names used in /app/lab?op=… links. */
export type LabOp = 'transfer' | 'erc20' | 'deploy' | 'calldata';
export const LAB_OPS: LabOp[] = ['transfer', 'erc20', 'deploy', 'calldata'];

export type LabParams = {
  op: LabOp;
  from?: string;
  to?: string;
  amount?: string;
  token?: string;
  recipient?: string;
  tokenAmount?: string;
  /** 'sample' | 'registry' | custom 0x creation bytecode */
  code?: string;
  callTo?: string;
  data?: string;
  /** Measure immediately when opened. */
  run?: boolean;
};

const KEYS: Record<Exclude<keyof LabParams, 'op' | 'run'>, string> = {
  from: 'from', to: 'to', amount: 'amount', token: 'token', recipient: 'rcpt', tokenAmount: 'tamt', code: 'code', callTo: 'callTo', data: 'data',
};

/** Longest custom hex we put in a URL (most browsers/servers are fine with ~16k). */
export const MAX_URL_HEX = 12_000;

const AMOUNT = /^\d+(\.\d+)?$/;
const HEX = /^0x[0-9a-fA-F]*$/;

export function encodeLabParams(p: LabParams): { query: string; omitted: string[] } {
  const q = new URLSearchParams();
  const omitted: string[] = [];
  q.set('op', p.op);
  for (const [k, short] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
    const v = p[k];
    if (v === undefined || v === '') continue;
    if ((k === 'code' || k === 'data') && HEX.test(v) && v.length > MAX_URL_HEX) { omitted.push(k); continue; }
    q.set(short, v);
  }
  if (p.run) q.set('run', '1');
  return { query: q.toString(), omitted };
}

export function decodeLabParams(search: string): { params: Partial<LabParams>; errors: string[] } {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const params: Partial<LabParams> = {};
  const errors: string[] = [];
  const op = q.get('op');
  if (op !== null) {
    if ((LAB_OPS as string[]).includes(op)) params.op = op as LabOp;
    else errors.push(`unknown op "${op}"`);
  }
  for (const [k, short] of Object.entries(KEYS) as [keyof typeof KEYS, string][]) {
    const v = q.get(short);
    if (v === null) continue;
    const ok =
      k === 'from' || k === 'to' || k === 'token' || k === 'recipient' ? isH160(v)
        : k === 'callTo' ? v === '' || isH160(v)
          : k === 'amount' || k === 'tokenAmount' ? AMOUNT.test(v)
            : k === 'code' ? v === 'sample' || v === 'registry' || (HEX.test(v) && v.length > 2)
              : HEX.test(v);
    if (ok) params[k] = v;
    else errors.push(`invalid ${short}`);
  }
  if (q.get('run') === '1') params.run = true;
  return { params, errors };
}

export function shareUrl(origin: string, p: LabParams): { url: string; omitted: string[] } {
  const { query, omitted } = encodeLabParams(p);
  return { url: `${origin.replace(/\/$/, '')}/app/lab?${query}`, omitted };
}

/** Lab link that reproduces a leaderboard preset. */
export function presetToLab(id: string): LabParams | null {
  switch (id) {
    case 'native-transfer': return { op: 'transfer' };
    case 'erc20-existing': return { op: 'erc20' };
    case 'erc20-fresh': return { op: 'erc20', recipient: '0x2222222222222222222222222222222222222222' };
    case 'deploy-erc20': return { op: 'deploy', code: 'sample' };
    case 'deploy-registry': return { op: 'deploy', code: 'registry' };
    default: return null;
  }
}
