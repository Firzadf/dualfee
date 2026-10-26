import { TIE_BAND, type Comparison } from '@dualfee/sdk';

export type Projection = {
  count: number;
  evm: bigint | null;
  nativeAllIn: bigint | null;
  nativeFeeOnly: bigint | null;
  /** Part of nativeAllIn that is a storage-deposit hold (refundable when storage is freed), not a burned fee. */
  nativeDepositHeld: bigint | null;
  cheaper: 'evm' | 'native' | 'either' | null;
  /** |evm − nativeAllIn| for the whole month, in planck. */
  savings: bigint | null;
  savingsPct: number | null;
};

export const MAX_MONTHLY = 1_000_000_000;

export function parseCount(v: string | number): number {
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(/[,_\s]/g, ''));
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw new Error('Monthly count must be a whole number ≥ 0');
  if (n > MAX_MONTHLY) throw new Error(`Monthly count must be ≤ ${MAX_MONTHLY.toLocaleString('en-US')}`);
  return n;
}

/**
 * Linear projection of one live comparison to `count` ops per month.
 * Assumes every op costs what this one did (same gas price, fee multiplier and storage pattern).
 */
export function project(c: Comparison, count: number): Projection {
  const k = BigInt(parseCount(count));
  const evm = c.evm.status === 'ok' ? c.evm.totalPlanck * k : null;
  const nativeAllIn = c.native.status === 'ok' ? c.native.totalPlanck * k : null;
  const nativeFeeOnly = c.native.status === 'ok' ? c.native.partialFee * k : null;
  const nativeDepositHeld = c.native.status === 'ok' ? c.native.storageDeposit * k : null;
  let cheaper: Projection['cheaper'] = null;
  let savings: bigint | null = null;
  let savingsPct: number | null = null;
  if (evm !== null && nativeAllIn !== null) {
    const diff = evm > nativeAllIn ? evm - nativeAllIn : nativeAllIn - evm;
    const bigger = evm > nativeAllIn ? evm : nativeAllIn;
    savings = diff;
    savingsPct = bigger === 0n ? 0 : Number((diff * 1_000_000n) / bigger) / 10_000;
    cheaper = bigger === 0n || savingsPct / 100 <= TIE_BAND ? 'either' : evm < nativeAllIn ? 'evm' : 'native';
  } else if (evm !== null) cheaper = 'evm';
  else if (nativeAllIn !== null) cheaper = 'native';
  return { count: Number(k), evm, nativeAllIn, nativeFeeOnly, nativeDepositHeld, cheaper, savings, savingsPct };
}
