import { describe, it, expect } from 'vitest';
import { h160ToAccountId32, accountId32ToH160, isEthDerived, isH160, h160ToSs58 } from '../src/mapping';
import { encodeRecord, RECORD_SELECTOR, opTypeOf, functionSelector } from '../src/registry';
import { erc20TransferCalldata } from '../src/evm';
import { toEvmTx } from '../src/index';

const H = '0x03c502abb79e8eee50135c91933d059d982dd912';

describe('account mapping', () => {
  it('H160 -> fallback AccountId32 is h160 ++ 0xEE*12', () => {
    expect(h160ToAccountId32(H)).toBe(H + 'ee'.repeat(12));
  });
  it('round-trips eth-derived accounts', () => {
    const acc = h160ToAccountId32(H);
    expect(isEthDerived(acc)).toBe(true);
    expect(accountId32ToH160(acc)).toBe(H);
  });
  it('native accounts map via keccak (last 20 bytes)', () => {
    const native = '0x' + '11'.repeat(32);
    const h = accountId32ToH160(native);
    expect(isH160(h)).toBe(true);
    expect(isEthDerived(native)).toBe(false);
    expect(h).not.toBe('0x' + '11'.repeat(20));
  });
  it('encodes SS58 with prefix 42', () => {
    expect(h160ToSs58(H).startsWith('5')).toBe(true);
  });
  it('rejects bad input', () => {
    expect(() => h160ToAccountId32('0x1234')).toThrow();
  });
});

describe('FeeRegistry encoding', () => {
  it('record selector matches the compiled bytecode dispatcher (0x5c253272)', () => {
    expect(RECORD_SELECTOR).toBe('0x5c253272');
    expect(functionSelector('count()')).toBe('0x06661abd');
  });
  it('encodes 4 static words', () => {
    const data = encodeRecord('0x' + 'ab'.repeat(32), 2, 10n, 3n);
    expect(data.length).toBe(10 + 64 * 4);
    expect(data.endsWith('3')).toBe(true);
  });
  it('rejects zero hash and bad op type', () => {
    expect(() => encodeRecord('0x' + '0'.repeat(64), 0, 1n, 1n)).toThrow();
    expect(() => encodeRecord('0x' + '1'.repeat(64), 9, 1n, 1n)).toThrow();
  });
  it('maps op kinds', () => {
    expect(opTypeOf('contractDeploy')).toBe(2);
    expect(opTypeOf('calldata')).toBe(3);
  });
});

describe('tx building', () => {
  it('ERC-20 transfer calldata', () => {
    expect(erc20TransferCalldata('0x' + '22'.repeat(20), 1n)).toBe('0xa9059cbb' + '0'.repeat(24) + '22'.repeat(20) + '0'.repeat(63) + '1');
  });
  it('native value is scaled planck -> wei for the EVM leg', () => {
    const t = toEvmTx({ kind: 'nativeTransfer', from: H, to: H, amountPlanck: 10n ** 14n });
    expect(t!.value).toBe(10n ** 18n);
  });
  it('pallet-assets ops have no EVM equivalent', () => {
    expect(toEvmTx({ kind: 'assetsTransfer', from: H, to: H, assetId: 1, amount: 1n })).toBeNull();
  });
});
