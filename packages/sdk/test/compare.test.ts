import { describe, it, expect } from 'vitest';
import { compareLegs, evmLegFromQuote, nativeLegFromQuote, serializeComparison, type NativeLeg, type EvmLeg } from '../src/compare';

const w = { refTime: 1n, proofSize: 1n };
const evm = (planck: bigint): EvmLeg => evmLegFromQuote('eth_estimateGas', { gas: planck * 10_000n, gasPrice: 1n, feeWei: planck * 10_000n, blockNumber: 1 });
const nat = (fee: bigint, dep = 0n): NativeLeg => nativeLegFromQuote({ method: 'x', partialFee: fee, storageDeposit: dep, weight: w, blockNumber: 1 });

describe('compareLegs', () => {
  it('recommends native when native is clearly cheaper', () => {
    const c = compareLegs(evm(1000n), nat(100n));
    expect(c.recommended).toBe('native');
    expect(c.ratioAllIn).toBe(10);
    expect(c.savingsPlanck).toBe(900n);
  });
  it('recommends evm when evm is clearly cheaper', () => {
    expect(compareLegs(evm(90n), nat(100n)).recommended).toBe('evm');
  });
  it('reports "either" inside the 2% tie band', () => {
    expect(compareLegs(evm(1015n), nat(1000n)).recommended).toBe('either');
  });
  it('separates all-in ratio from the fee-only headline ratio (deploy case)', () => {
    // shape of the live deploy measurement: EVM ~124.10, native fee ~0.154 + deposit ~122.04
    const c = compareLegs(evm(12_409_821_900_000_000n), nat(15_441_200_000_000n, 12_203_700_000_000_000n));
    expect(c.ratioAllIn!).toBeGreaterThan(1);
    expect(c.ratioAllIn!).toBeLessThan(1.02);
    expect(c.ratioVsNativeFeeOnly!).toBeGreaterThan(790);
    expect(c.recommended).toBe('either');
  });
  it('is honest when one side is unavailable', () => {
    const c = compareLegs({ status: 'unavailable', method: 'eth_estimateGas', reason: 'reverted' }, nat(5n));
    expect(c.recommended).toBe('native');
    expect(c.ratioAllIn).toBeNull();
    const d = compareLegs(evm(5n), { status: 'unavailable', method: 'revive.call', reason: 'x' });
    expect(d.recommended).toBe('evm');
    const e = compareLegs({ status: 'unavailable', method: 'a', reason: 'b' }, { status: 'unavailable', method: 'c', reason: 'd' });
    expect(e.recommended).toBeNull();
  });
  it('serializes bigints as strings', () => {
    const s = serializeComparison(compareLegs(evm(2n), nat(1n), new Date(0)));
    expect(s).toContain('"partialFee":"1"');
    expect(s).toContain('1970-01-01');
  });
});
