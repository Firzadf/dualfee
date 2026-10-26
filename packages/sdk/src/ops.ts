import type { DualTx } from './types';
import { SAMPLE } from './samples';
import { SampleTokenBytecode, FeeRegistryBytecode } from './artifacts';

export type PresetOp = { id: string; label: string; detail: string; tx: DualTx };

/** The common operations shown on the leaderboard. All inputs are public testnet data. */
export function presetOps(from: string = SAMPLE.holder): PresetOp[] {
  return [
    {
      id: 'native-transfer',
      label: 'Native tPOT transfer',
      detail: '1 tPOT to an existing funded EOA. EVM: plain value transfer; native: balances.transferKeepAlive.',
      tx: { kind: 'nativeTransfer', from, to: SAMPLE.existingEoa, amountPlanck: 10n ** 14n },
    },
    {
      id: 'erc20-existing',
      label: 'ERC-20 transfer (existing holder)',
      detail: `1 base unit of ${SAMPLE.erc20Symbol} to an address that already holds it. EVM tx vs the same call as native revive.call.`,
      tx: { kind: 'erc20Transfer', from, token: SAMPLE.erc20Token, to: SAMPLE.existingRecipient, amount: 1n },
    },
    {
      id: 'erc20-fresh',
      label: 'ERC-20 transfer (new recipient)',
      detail: 'Same transfer to a fresh address — creates a new storage slot, so a storage deposit applies.',
      tx: { kind: 'erc20Transfer', from, token: SAMPLE.erc20Token, to: SAMPLE.freshRecipient, amount: 1n },
    },
    {
      id: 'deploy-erc20',
      label: 'Deploy sample ERC-20',
      detail: 'SampleToken.sol bytecode. EVM create vs native revive.instantiateWithCode.',
      tx: { kind: 'contractDeploy', from, bytecode: SampleTokenBytecode },
    },
    {
      id: 'deploy-registry',
      label: 'Deploy FeeRegistry',
      detail: 'DualFee\'s own registry contract.',
      tx: { kind: 'contractDeploy', from, bytecode: FeeRegistryBytecode },
    },
    {
      id: 'assets-transfer',
      label: 'pallet-assets transfer (native only)',
      detail: `Asset #${SAMPLE.nativeAssetId}. No verified EVM precompile address, so EVM is shown as unavailable.`,
      tx: { kind: 'assetsTransfer', from, assetId: SAMPLE.nativeAssetId, to: SAMPLE.existingEoa, amount: 1n },
    },
  ];
}
