/**
 * Runs every leaderboard op live against Portaldot V3 and prints the real numbers.
 * Usage: npm run measure  (read-only; signs nothing)
 */
import { estimateBoth, presetOps, formatUnits, getApi, liveDecimals, DEFAULT_NETWORK, evmChainId } from '../packages/sdk/src/index';


async function main() {
  const chainId = await evmChainId(DEFAULT_NETWORK.evmRpc);
  const api = await getApi(DEFAULT_NETWORK.substrateWss);
  const d = await liveDecimals(api);
  const fmt = (p: bigint) => formatUnits(p, d.nativeDecimals, 6);
  const network = { ...DEFAULT_NETWORK, nativeDecimals: d.nativeDecimals, evmDecimals: d.evmDecimals ?? DEFAULT_NETWORK.evmDecimals };
  console.log(`EVM chainId ${chainId}; native chain ${(await api.rpc.system.chain()).toString()}; ${d.symbol} ${d.nativeDecimals} dp; revive.nativeToEthRatio ${d.nativeToEthRatio} -> EVM ${d.evmDecimals} dp`);
  const rows: Record<string, string>[] = [];
  for (const op of presetOps()) {
    const c = await estimateBoth(op.tx, { api, network });
    const row: Record<string, string> = { op: op.id };
    row.evm = c.evm.status === 'ok' ? `${fmt(c.evm.totalPlanck)} (gas ${c.evm.gas} @ ${c.evm.gasPrice} wei)` : `unavailable: ${c.evm.reason}`;
    row.native = c.native.status === 'ok' ? `${fmt(c.native.partialFee)} fee + ${fmt(c.native.storageDeposit)} deposit [${c.native.method}]` : `unavailable: ${c.native.reason}`;
    row.ratioAllIn = c.ratioAllIn?.toFixed(3) ?? '—';
    row.ratioVsFeeOnly = c.ratioVsNativeFeeOnly?.toFixed(1) ?? '—';
    row.pick = String(c.recommended);
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  console.log(`measuredAt ${new Date().toISOString()}`);
  await api.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
