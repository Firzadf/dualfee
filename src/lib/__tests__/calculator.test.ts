import { describe, expect, it } from 'vitest';
import { parseCount, project, MAX_MONTHLY } from '../calculator';
import { deployCmp, transferCmp, evmDown } from './fixtures';

describe('calculator', () => {
  it('multiplies per-op costs exactly in bigint', () => {
    const p = project(transferCmp, 1000);
    expect(p.evm).toBe(transferCmp.evm.status === 'ok' ? transferCmp.evm.totalPlanck * 1000n : null);
    expect(p.nativeAllIn).toBe(transferCmp.native.status === 'ok' ? transferCmp.native.totalPlanck * 1000n : null);
    expect(p.nativeDepositHeld).toBe(0n);
  });
  it('picks EVM for transfers and reports the savings', () => {
    const p = project(transferCmp, 10_000);
    expect(p.cheaper).toBe('evm');
    expect(p.savings).toBe(p.nativeAllIn! - p.evm!);
    expect(p.savingsPct).toBeGreaterThan(10);
    expect(p.savingsPct).toBeLessThan(13);
  });
  it('treats deploys (all-in within 2%) as a tie, and splits the deposit out', () => {
    const p = project(deployCmp, 3);
    expect(p.cheaper).toBe('either');
    expect(p.nativeDepositHeld! > p.nativeFeeOnly! * 100n).toBe(true);
  });
  it('zero ops cost zero', () => {
    const p = project(deployCmp, 0);
    expect(p.evm).toBe(0n);
    expect(p.savings).toBe(0n);
  });
  it('handles an unavailable surface without inventing a number', () => {
    const p = project(evmDown, 5);
    expect(p.evm).toBeNull();
    expect(p.savings).toBeNull();
    expect(p.cheaper).toBe('native');
  });
  it('validates the monthly count', () => {
    expect(parseCount('1,000')).toBe(1000);
    expect(() => parseCount('-1')).toThrow();
    expect(() => parseCount('1.5')).toThrow();
    expect(() => parseCount(MAX_MONTHLY + 1)).toThrow();
  });
});
