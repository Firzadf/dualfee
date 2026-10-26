import { useEffect, useState } from 'react';
import { DEFAULT_NETWORK, PORTALDOT_V3, evmChainId, evmRpc, getApi, hexToBigInt, liveDecimals, type NetworkConfig } from '@dualfee/sdk';

export type NetStatus = {
  evm: { ok: true; chainId: number; block: number; gasPrice: bigint } | { ok: false; error: string } | null;
  native: { ok: true; chain: string; specVersion: number; block: number; decimals: number; symbol: string; evmDecimals: number | null; ratio: bigint | null } | { ok: false; error: string } | null;
};

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Network config with decimals taken from the live runtime when available (falls back to verified constants). */
export function networkFrom(status: NetStatus): NetworkConfig {
  const n = status.native;
  if (n && n.ok) return { ...DEFAULT_NETWORK, nativeDecimals: n.decimals, evmDecimals: n.evmDecimals ?? DEFAULT_NETWORK.evmDecimals };
  return DEFAULT_NETWORK;
}

export function useNetworkStatus(): NetStatus {
  const [s, setS] = useState<NetStatus>({ evm: null, native: null });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [chainId, blockHex, priceHex] = await Promise.all([
          evmChainId(PORTALDOT_V3.evmRpc),
          evmRpc<string>(PORTALDOT_V3.evmRpc, 'eth_blockNumber'),
          evmRpc<string>(PORTALDOT_V3.evmRpc, 'eth_gasPrice'),
        ]);
        if (alive) setS((p) => ({ ...p, evm: { ok: true, chainId, block: Number(hexToBigInt(blockHex)), gasPrice: hexToBigInt(priceHex) } }));
      } catch (e) {
        if (alive) setS((p) => ({ ...p, evm: { ok: false, error: msg(e) } }));
      }
    })();
    (async () => {
      try {
        const api = await getApi(PORTALDOT_V3.substrateWss);
        const [chain, header, d] = await Promise.all([api.rpc.system.chain(), api.rpc.chain.getHeader(), liveDecimals(api)]);
        if (alive)
          setS((p) => ({
            ...p,
            native: { ok: true, chain: chain.toString(), specVersion: api.runtimeVersion.specVersion.toNumber(), block: header.number.toNumber(), decimals: d.nativeDecimals, symbol: d.symbol, evmDecimals: d.evmDecimals, ratio: d.nativeToEthRatio },
          }));
      } catch (e) {
        if (alive) setS((p) => ({ ...p, native: { ok: false, error: msg(e) } }));
      }
    })();
    return () => { alive = false; };
  }, []);
  return s;
}
