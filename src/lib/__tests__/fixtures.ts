import { compareLegs, type EvmLeg, type NativeLeg } from '@dualfee/sdk';

const P = 10n ** 14n; // 1 tPOT in planck

/** Shapes taken from the README's measured deploy row (values in planck); used only as test fixtures. */
export const evmDeploy: EvmLeg = { status: 'ok', method: 'eth_estimateGas (create)', gas: 4_130_404_363n, gasPrice: 30_045n, feeWei: 124_098_219_000_000_000_000n, totalPlanck: 12_409_821_900_000_000n, blockNumber: 1 };
export const nativeDeploy: NativeLeg = { status: 'ok', method: 'revive.instantiateWithCode', partialFee: 15_441_100_000_000n, storageDeposit: 12_203_700_000_000_000n, totalPlanck: 15_441_100_000_000n + 12_203_700_000_000_000n, weight: { refTime: 1n, proofSize: 1n }, blockNumber: 1 };
export const evmTransfer: EvmLeg = { status: 'ok', method: 'eth_estimateGas', gas: 1n, gasPrice: 30_000n, feeWei: 0n, totalPlanck: (13_109n * P) / 1_000_000n, blockNumber: 2 };
export const nativeTransfer: NativeLeg = { status: 'ok', method: 'balances.transferKeepAlive', partialFee: (14_905n * P) / 1_000_000n, storageDeposit: 0n, totalPlanck: (14_905n * P) / 1_000_000n, weight: { refTime: 1n, proofSize: 1n }, blockNumber: 2 };

export const deployCmp = compareLegs(evmDeploy, nativeDeploy, new Date('2026-10-26T13:13:00.000Z'));
export const transferCmp = compareLegs(evmTransfer, nativeTransfer, new Date('2026-10-26T13:14:00.000Z'));
export const evmDown = compareLegs({ status: 'unavailable', method: 'eth_estimateGas', reason: 'timeout' }, nativeTransfer, new Date('2026-10-26T13:15:00.000Z'));
