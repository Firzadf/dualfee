import { describe, it, expect } from 'vitest';
import { rescale, weiToPlanck, planckToWei, formatUnits, parseUnits, ratio, hexToBigInt, toHex } from '../src/units';
import { PORTALDOT_V3 } from '../src/constants';

describe('decimals', () => {
  it('native is 14 dp and EVM is 18 dp (ratio 10^4, matches revive.nativeToEthRatio)', () => {
    expect(PORTALDOT_V3.nativeDecimals).toBe(14);
    expect(PORTALDOT_V3.evmDecimals).toBe(18);
    expect(planckToWei(1n)).toBe(10_000n);
  });
  it('1 tPOT round-trips between planck and wei', () => {
    const onePlanck = 10n ** 14n;
    const oneWei = 10n ** 18n;
    expect(planckToWei(onePlanck)).toBe(oneWei);
    expect(weiToPlanck(oneWei)).toBe(onePlanck);
  });
  it('wei -> planck truncates dust below 1 planck', () => {
    expect(weiToPlanck(9_999n)).toBe(0n);
    expect(weiToPlanck(19_999n)).toBe(1n);
  });
  it('rescale is identity for equal decimals', () => {
    expect(rescale(123n, 6, 6)).toBe(123n);
  });
});

describe('formatting', () => {
  it('formats planck to tPOT', () => {
    expect(formatUnits(1_490_502_823_702n, 14, 6)).toBe('0.014905');
    expect(formatUnits(12_409_821_900_000_000n, 14, 3)).toBe('124.098');
    expect(formatUnits(10n ** 14n * 1234n, 14)).toBe('1,234');
  });
  it('shows tiny non-zero values as <0.0…1 instead of 0', () => {
    expect(formatUnits(1n, 14, 4)).toBe('<0.0001');
  });
  it('parses decimal strings', () => {
    expect(parseUnits('1', 14)).toBe(10n ** 14n);
    expect(parseUnits('0.5', 18)).toBe(5n * 10n ** 17n);
    expect(() => parseUnits('1.123', 2)).toThrow();
    expect(() => parseUnits('abc', 2)).toThrow();
  });
});

describe('fee math', () => {
  it('EVM fee = gas x gasPrice, converted to planck', () => {
    // values observed live on 2026-10-26 for an ERC-20 transfer
    const gas = 649_320_011_179n;
    const gasPrice = 30_050n;
    const wei = gas * gasPrice;
    expect(weiToPlanck(wei)).toBe(1_951_206_633_592n);
    expect(formatUnits(weiToPlanck(wei), 14, 6)).toBe('0.019512');
  });
  it('ratio handles zero and precision', () => {
    expect(ratio(10n, 0n)).toBeNull();
    expect(ratio(800n, 1n)).toBe(800);
    expect(ratio(1n, 3n)).toBeCloseTo(0.333333, 6);
  });
  it('hex helpers', () => {
    expect(hexToBigInt('0x7562')).toBe(30050n);
    expect(hexToBigInt('0x')).toBe(0n);
    expect(toHex(420420777n)).toBe('0x190f1ca9');
    expect(() => hexToBigInt('12')).toThrow();
  });
});
