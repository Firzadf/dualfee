import { keccakAsHex } from '@polkadot/util-crypto';
import type { OpKind } from './types';
import type { Comparison } from './compare';
import { serializeComparison } from './compare';

/** Mirrors `FeeRegistry.OpType` in contracts/FeeRegistry.sol. */
export const OP_TYPE = { NativeTransfer: 0, Erc20Transfer: 1, ContractDeploy: 2, CustomCalldata: 3 } as const;
export type OpTypeId = (typeof OP_TYPE)[keyof typeof OP_TYPE];

export function opTypeOf(kind: OpKind): OpTypeId {
  switch (kind) {
    case 'nativeTransfer': return OP_TYPE.NativeTransfer;
    case 'erc20Transfer':
    case 'assetsTransfer': return OP_TYPE.Erc20Transfer;
    case 'contractDeploy': return OP_TYPE.ContractDeploy;
    case 'calldata': return OP_TYPE.CustomCalldata;
  }
}

export function functionSelector(signature: string): string {
  return keccakAsHex(signature, 256).slice(0, 10);
}

/** 4-byte selector of FeeRegistry.record(bytes32,uint8,uint128,uint128). */
export const RECORD_SELECTOR = functionSelector('record(bytes32,uint8,uint128,uint128)');

const MAX_U128 = (1n << 128n) - 1n;

function word(n: bigint): string {
  if (n < 0n) throw new Error('negative value');
  return n.toString(16).padStart(64, '0');
}

/** keccak256 over the canonical JSON of a comparison (bigints as decimal strings). */
export function comparisonHash(c: Comparison): `0x${string}` {
  return keccakAsHex(serializeComparison(c), 256) as `0x${string}`;
}

/** ABI-encode a call to FeeRegistry.record. Fees: EVM in wei (18 dp), native in planck (14 dp). */
export function encodeRecord(hash: string, opType: number, evmFeeWei: bigint, nativeFeePlanck: bigint): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash) || /^0x0{64}$/.test(hash)) throw new Error('hash must be a non-zero bytes32');
  if (!Number.isInteger(opType) || opType < 0 || opType > 3) throw new Error('opType out of range');
  if (evmFeeWei > MAX_U128 || nativeFeePlanck > MAX_U128) throw new Error('fee exceeds uint128');
  return RECORD_SELECTOR + hash.slice(2).toLowerCase() + word(BigInt(opType)) + word(evmFeeWei) + word(nativeFeePlanck);
}
